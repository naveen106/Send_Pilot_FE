import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignsApi } from '../api';
import { Campaign, SendMode } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Zap } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import ComposeForm from '../components/campaigns/ComposeForm';
import CampaignTable from '../components/campaigns/CampaignTable';
import CampaignDetailModal from '../components/campaigns/CampaignDetailModal';
import { usePolling } from '../hooks/usePolling';
import { useSelection } from '../hooks/useSelection';
import { extractEmails, hasEmail } from '../utils/email';

// Default empty state for the compose form fields
const EMPTY_FORM = { name: '', subject: '', htmlContent: '' };

export default function CampaignsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  // --- Campaign list state ---
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  // Multi-select state for bulk delete — tracks selected campaign IDs
  const { selected, toggle: toggleSelect, toggleAll, clear: clearSelected, allSelected, someSelected } = useSelection(campaigns);

  // --- Compose form state ---
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  // Tag-input state: toInput is the live text, toTags are the committed email chips
  const [toInput, setToInput] = useState('');
  const [toTags, setToTags] = useState<string[]>([]);
  const [toError, setToError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // --- Detail modal state ---
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  // --- Delete state ---
  // deleteTarget is either a single Campaign or 'bulk' for multi-select delete
  const [deleteTarget, setDeleteTarget] = useState<Campaign | 'bulk' | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Send mode state ---
  const [sendMode, setSendMode] = useState<SendMode>('immediate');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const location = useLocation();

  // If navigated from ContactsPage with pre-selected emails, open the form pre-filled
  useEffect(() => {
    const state = location.state as { prefillTo?: string } | null;
    if (state?.prefillTo) {
      setToTags(extractEmails(state.prefillTo));
      setShowForm(true);
      // Clear router state so a refresh doesn't re-trigger this
      window.history.replaceState({}, '');
    }
  }, []);

  // Fetches the full campaign list from the API
  function load() {
    campaignsApi.getAll()
      .then((r) => setCampaigns(r.data.data.campaigns))
      .catch(() => toast.error('Failed to load campaigns'));
  }

  useEffect(() => { load(); }, []);

  // Poll every 5 s while any campaign is RUNNING or DRAFT (actively changing)
  // Poll every 60 s while campaigns are only SCHEDULED (waiting for their start time)
  const hasHot = campaigns.some((c) => c.status === 'RUNNING' || c.status === 'DRAFT');
  const hasScheduled = campaigns.some((c) => c.status === 'SCHEDULED');
  usePolling(load, 5000, hasHot);
  usePolling(load, 60000, !hasHot && hasScheduled);

  // Extracts all valid emails from pasted text (handles comma/space/semicolon/newline separators)
  function handleToPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text');
    const extracted = extractEmails(text);
    if (!extracted.length) return;
    e.preventDefault();
    setToTags((p) => [...p, ...extracted.filter((em) => !hasEmail(p, em))]);
    setToError('');
  }

  // Commits the current text in the recipient input as one or more validated email tags.
  // Accepts free-form multi-email text, not only a single clean address.
  function commitToInput() {
    const val = toInput.trim();
    if (!val) return;
    const extracted = extractEmails(val);
    if (!extracted.length) {
      setToError('No valid email addresses found');
      return;
    }
    const fresh = extracted.filter((em) => !hasEmail(toTags, em));
    if (!fresh.length) {
      setToError('Already added');
      setToInput('');
      return;
    }
    setToTags((p) => [...p, ...fresh]);
    setToInput('');
    setToError('');
  }

  // Handles keyboard shortcuts in the recipient tag input:
  // Enter/comma/Tab → commit tag | Backspace on empty input → remove last tag
  function handleToKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      commitToInput();
    } else if (e.key === 'Backspace' && toInput === '' && toTags.length > 0) {
      setToTags((p) => p.slice(0, -1));
      setToError('');
    } else {
      setToError('');
    }
  }

  // Resets all compose form state back to defaults and closes the panel
  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setToTags([]);
    setToInput('');
    setToError('');
    setAttachments([]);
    setSendMode('immediate');
    setScheduledAt('');
    setShowModeMenu(false);
  }

  // Handles campaign creation: commits any pending tag input, validates, then POSTs to the API
  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();

    // Commit any emails still typed but not yet tagged before submitting
    const pending = toInput.trim();
    let finalTags = toTags;
    if (pending) {
      const extracted = extractEmails(pending);
      if (!extracted.length) {
        setToError('No valid email addresses found');
        return;
      }
      finalTags = [...toTags];
      for (const em of extracted) {
        if (!hasEmail(finalTags, em)) finalTags.push(em);
      }
      setToTags(finalTags);
      setToInput('');
    }
    if (finalTags.length === 0) { setToError('Add at least one recipient'); return; }
    if (sendMode === 'scheduled' && !scheduledAt) { toast.error('Please pick a schedule date & time'); return; }

    setSubmitting(true);
    try {
      await campaignsApi.create({
        name: form.name, subject: form.subject, htmlContent: form.htmlContent,
        recipients: finalTags,
        // Only send scheduledAt when mode is 'scheduled'
        scheduledAt: sendMode === 'scheduled' ? scheduledAt : undefined,
        sendMode,
      }, attachments);
      toast.success(
        sendMode === 'immediate' ? 'Campaign queued!' :
        sendMode === 'scheduled' ? 'Campaign scheduled!' :
        'Interval campaign queued!'
      );
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSubmitting(false); }
  }

  // Retries a failed/paused campaign — stops event bubbling so the row click doesn't fire
  async function handleRetry(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    try { await campaignsApi.retry(id); toast.success('Retry initiated'); load(); }
    catch { toast.error('Failed to retry'); }
  }

  // Sets the delete target to a single campaign, opening the confirm dialog
  function promptDelete(e: React.MouseEvent, campaign: Campaign) {
    e.stopPropagation();
    setDeleteTarget(campaign);
  }

  // Executes the confirmed delete — handles both single and bulk cases
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget === 'bulk') {
        // Bulk delete: send all selected IDs, then remove them from local state
        await campaignsApi.bulkRemove([...selected]);
        const ids = [...selected];
        toast.success(`${ids.length} campaigns deleted`);
        setCampaigns((p) => p.filter((c) => !ids.includes(c.id)));
        // Close the detail modal if the open campaign was among those deleted
        setDetailCampaign((s) => s && ids.includes(s.id) ? null : s);
      } else {
        await campaignsApi.remove(deleteTarget.id);
        toast.success('Campaign deleted');
        setCampaigns((p) => p.filter((c) => c.id !== deleteTarget.id));
        setDetailCampaign((s) => s?.id === deleteTarget.id ? null : s);
      }
      clearSelected();
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  }

  // Always show the latest polled data in the detail modal, not the stale snapshot from when it was opened
  const selectedLive = detailCampaign
    ? (campaigns.find((c) => c.id === detailCampaign.id) ?? detailCampaign)
    : null;

  return (
    <div className="p-6 max-w-6xl">
      {/* Page title + action buttons (bulk delete, new campaign) */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader icon={Zap} label="Email Campaigns" title="Campaigns" />
        <div className="flex items-center gap-2">
          {/* Bulk delete button — only visible when one or more rows are checked */}
          {isAdmin && someSelected && (
            <button onClick={() => setDeleteTarget('bulk')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors">
              <Trash2 size={13} /> Delete {selected.size}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={15} /> New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Compose form panel — shown when "New Campaign" is clicked */}
      {showForm && (
        <ComposeForm
          form={form}
          toInput={toInput}
          toTags={toTags}
          toError={toError}
          attachments={attachments}
          submitting={submitting}
          sendMode={sendMode}
          showModeMenu={showModeMenu}
          scheduledAt={scheduledAt}
          onFormChange={(field, value) => setForm((p) => ({ ...p, [field]: value }))}
          onToInputChange={(v) => { setToInput(v); setToError(''); }}
          onToKeyDown={handleToKeyDown}
          onToPaste={handleToPaste}
          onToBlur={commitToInput}
          onRemoveTag={(email) => setToTags((p) => p.filter((t) => t !== email))}
          onClearTags={() => setToTags([])}
          onFilesChange={(e) => { setAttachments((p) => [...p, ...Array.from(e.target.files ?? [])]); e.target.value = ''; }}
          onRemoveAttachment={(i) => setAttachments((p) => p.filter((_, j) => j !== i))}
          onSendModeSelect={(mode) => { setSendMode(mode); setShowModeMenu(false); }}
          onToggleModeMenu={() => setShowModeMenu((v) => !v)}
          onCloseModeMenu={() => setShowModeMenu(false)}
          onScheduledAtChange={setScheduledAt}
          onSubmit={handleCreate}
          onClose={closeForm}
        />
      )}

      {/* Campaign list table with checkboxes, status badges, and row click to open detail */}
      <CampaignTable
        campaigns={campaigns}
        isAdmin={isAdmin}
        selected={selected}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onRowClick={setDetailCampaign}
        onDelete={promptDelete}
      />

      {/* Detail modal — opens when a table row is clicked; stays in sync with live poll data */}
      {selectedLive && (
        <CampaignDetailModal
          campaign={selectedLive}
          isAdmin={isAdmin}
          onClose={() => setDetailCampaign(null)}
          onDelete={promptDelete}
          onRetry={handleRetry}
        />
      )}

      {/* Confirm dialog — shown for both single and bulk deletes */}
      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget === 'bulk' ? `Delete ${selected.size} campaigns?` : 'Delete campaign?'}
          message={deleteTarget === 'bulk'
            ? <><span className="text-slate-200 font-medium">{selected.size} campaigns</span> will be permanently deleted. This action cannot be undone.</>
            : <><span className="text-slate-200 font-medium">&ldquo;{(deleteTarget as Campaign).name}&rdquo;</span> will be permanently deleted. This action cannot be undone.</>}
          confirmLabel="Yes, delete"
          icon={<Trash2 size={18} className="text-red-400" />}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

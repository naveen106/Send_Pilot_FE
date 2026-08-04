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
import CampaignSearchDropdown from '../components/CampaignSearchDropdown';
import Pagination from '../components/Pagination';
import SendAssignedCampaignDialog from '../components/campaigns/SendAssignedCampaignDialog';
import { getAssignedRecipients } from '../utils/campaign';
import { DEFAULT_24_HOUR_EMAIL_LIMIT, isValid24HourEmailLimit } from '../constants/email';

// Default empty state for the compose form fields
const EMPTY_FORM = { name: '', subject: '', htmlContent: '' };
const PAGE_SIZE = 15;

export default function CampaignsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const canSend = isAdmin || hasRole('MANAGER');

  // --- Campaign list state ---
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
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
  const [dailyLimit, setDailyLimit] = useState<number | ''>(DEFAULT_24_HOUR_EMAIL_LIMIT);
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
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [sending, setSending] = useState(false);
  const [activeSendCampaignId, setActiveSendCampaignId] = useState<number | null>(null);

  const location = useLocation();

  // If navigated from ContactsPage with pre-selected emails, open the form pre-filled
  useEffect(() => {
    const state = location.state as { prefillTo?: string; prefillCampaign?: Partial<Campaign> } | null;
    if (state?.prefillTo || state?.prefillCampaign) {
      if (state.prefillTo) setToTags(extractEmails(state.prefillTo));
      const prefillCampaign = state.prefillCampaign;
      if (prefillCampaign) {
        setForm((prev) => ({
          name: prefillCampaign.name ?? prev.name,
          subject: prefillCampaign.subject ?? prev.subject,
          htmlContent: prefillCampaign.htmlContent ?? prev.htmlContent,
        }));
      }
      setShowForm(true);
      // Clear router state so a refresh doesn't re-trigger this
      window.history.replaceState({}, '');
    }
  }, []);

  // Fetches the full campaign list from the API
  function load(requestedPage = page) {
    campaignsApi.getAll(requestedPage, PAGE_SIZE)
      .then((r) => {
        const data = r.data.data;
        if (requestedPage > 1 && data.campaigns.length === 0) {
          setPage(requestedPage - 1);
          return;
        }
        setCampaigns(data.campaigns);
        setTotalCampaigns(data.total);

        // Search can open a campaign that is not present on the current page.
        // Refresh that selected campaign directly so its pending assignments
        // and delivery history still update while interval sending runs.
        const selectedId = detailCampaign?.id;
        if (selectedId && !data.campaigns.some((campaign: Campaign) => campaign.id === selectedId)) {
          campaignsApi.getOne(selectedId)
            .then((response) => setDetailCampaign(response.data.data))
            .catch(() => { /* The list refresh remains usable if the detail request fails. */ });
        }
      })
      .catch(() => toast.error('Failed to load campaigns'));
  }

  useEffect(() => { load(page); }, [page]);

  // Poll every 5 s while any campaign is RUNNING or DRAFT (actively changing)
  // Poll every 60 s while campaigns are only SCHEDULED (waiting for their start time)
  const hasHot = campaigns.some((c) => c.status === 'RUNNING' || c.status === 'DRAFT')
    || activeSendCampaignId !== null;
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
    setDailyLimit(DEFAULT_24_HOUR_EMAIL_LIMIT);
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
    if (typeof dailyLimit !== 'number' || !isValid24HourEmailLimit(dailyLimit)) { toast.error('24-hour email limit must be between 1 and 200'); return; }
    if (sendMode === 'scheduled' && !scheduledAt) { toast.error('Please pick a schedule date & time'); return; }

    setSubmitting(true);
    try {
      await campaignsApi.create({
        name: form.name, subject: form.subject, htmlContent: form.htmlContent,
        recipients: finalTags,
        // Only send scheduledAt when mode is 'scheduled'
        scheduledAt: sendMode === 'scheduled' ? scheduledAt : undefined,
        sendMode,
        dailyLimit,
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

  /** Opens the review dialog; the dialog always derives its audience from assignments. */
  function promptSend(campaign: Campaign) {
    if (!getAssignedRecipients(campaign).length) {
      toast.error('Assign at least one contact before sending this campaign');
      return;
    }
    setSendTarget(campaign);
  }

  function closeDetail() {
    setDetailCampaign(null);
    setActiveSendCampaignId(null);
  }

  async function confirmSend(sendMode: SendMode, scheduledAt?: string, dailyLimit?: number) {
    if (!sendTarget) return;
    setSending(true);
    try {
      await campaignsApi.sendNow(sendTarget.id, { sendMode, scheduledAt, dailyLimit });
      // Start polling immediately even when the campaign was previously
      // COMPLETED/FAILED and therefore was not considered "hot" by the page.
      // The backend updates assignment rows and delivery history after each
      // interval email; polling then keeps both modal lists in sync.
      setCampaigns((current) => current.map((campaign) => campaign.id === sendTarget.id
        ? {
            ...campaign,
            status: sendMode === 'scheduled' ? 'SCHEDULED' : 'RUNNING',
            scheduledAt: sendMode === 'scheduled' ? scheduledAt : campaign.scheduledAt,
          }
        : campaign
      ));
      setActiveSendCampaignId(sendTarget.id);
      toast.success(
        sendMode === 'scheduled' ? 'Assigned campaign scheduled!' :
        sendMode === 'interval' ? 'Assigned campaign queued with interval sending!' :
        `Campaign queued for ${getAssignedRecipients(sendTarget).length} assigned contact(s)`
      );
      setSendTarget(null);
      // Do not immediately reload here: the background worker may not have
      // changed the persisted status yet. The optimistic RUNNING/SCHEDULED
      // state above keeps polling active until the server reflects progress.
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
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
      load(page);
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
          dailyLimit={dailyLimit}
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
          onDailyLimitChange={setDailyLimit}
          onSubmit={handleCreate}
          onClose={closeForm}
        />
      )}

      {/* Full-width server-backed search placed immediately above the table. */}
      <div className="mb-4">
        <CampaignSearchDropdown onSelect={setDetailCampaign} />
      </div>

      {/* Campaign list table with checkboxes, status badges, and row click to open detail */}
      <CampaignTable
        campaigns={campaigns}
        totalCount={totalCampaigns}
        isAdmin={isAdmin}
        selected={selected}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onRowClick={setDetailCampaign}
        onDelete={promptDelete}
      />
      <Pagination page={page} total={totalCampaigns} pageSize={PAGE_SIZE}
        onPageChange={(nextPage) => { clearSelected(); setPage(nextPage); }} />

      {/* Detail modal — opens when a table row is clicked; stays in sync with live poll data */}
      {selectedLive && (
        <CampaignDetailModal
          campaign={selectedLive}
          isAdmin={isAdmin}
          canSend={canSend}
          onClose={closeDetail}
          onDelete={promptDelete}
          onRetry={handleRetry}
          onSend={promptSend}
        />
      )}

      {sendTarget && (
        <SendAssignedCampaignDialog campaign={sendTarget} submitting={sending}
          onConfirm={confirmSend} onCancel={() => !sending && setSendTarget(null)} />
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

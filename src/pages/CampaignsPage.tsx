import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, Send, RefreshCw, X, Zap, Paperclip, Trash2,
  ChevronDown, Clock, Shuffle, Zap as ZapIcon,
  Users, FileText, Calendar, ChevronRight,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSelection } from '../hooks/useSelection';

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-slate-500/15 text-slate-400 border-slate-500/20',
  SCHEDULED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  RUNNING:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FAILED:    'bg-red-500/15 text-red-400 border-red-500/20',
  PAUSED:    'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

type SendMode = 'immediate' | 'scheduled' | 'interval';

const SEND_MODES: { mode: SendMode; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { mode: 'immediate', label: 'Send Now',      desc: 'Deliver to all recipients immediately',                    icon: ZapIcon, color: 'text-emerald-400' },
  { mode: 'scheduled', label: 'Schedule Send', desc: 'Start sending after a specific date & time',              icon: Clock,   color: 'text-amber-400'  },
  { mode: 'interval',  label: 'Interval Send', desc: 'Send at random intervals within daily limit (anti-spam)', icon: Shuffle, color: 'text-violet-400' },
];

const EMPTY_FORM = { name: '', subject: '', htmlContent: '' };

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function CampaignsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { selected, toggle: toggleSelect, toggleAll, clear: clearSelected, allSelected, someSelected } = useSelection(campaigns);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toInput, setToInput] = useState('');
  const [toTags, setToTags] = useState<string[]>([]);
  const [toError, setToError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | 'bulk' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const location = useLocation();
  const toInputRef = useRef<HTMLInputElement>(null);

  // pre-fill recipients from contacts page
  useEffect(() => {
    const state = location.state as { prefillTo?: string } | null;
    if (state?.prefillTo) {
      const emails = state.prefillTo.split(',').map((e) => e.trim()).filter(isValidEmail);
      setToTags(emails);
      setShowForm(true);
      window.history.replaceState({}, '');
    }
  }, []);

  const [sendMode, setSendMode] = useState<SendMode>('immediate');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function load() {
    campaignsApi.getAll()
      .then((r) => {
        const updated = r.data.data.campaigns;
        setCampaigns(updated);

      })
      .catch(() => toast.error('Failed to load campaigns'));
  }

  useEffect(() => { load(); }, []);

  // Start polling whenever a campaign becomes active
  useEffect(() => {
    const hasHot = campaigns.some((c) => c.status === 'RUNNING' || c.status === 'DRAFT');
    const hasScheduled = campaigns.some((c) => c.status === 'SCHEDULED');
    const interval = hasHot ? 5000 : hasScheduled ? 60000 : null;

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (interval) pollRef.current = setInterval(load, interval);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [campaigns.map((c) => c.status).join(',')]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowModeMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Commit the current toInput value as a tag
  function commitToInput() {
    const val = toInput.trim();
    if (!val) return;
    if (!isValidEmail(val)) { setToError('Invalid email address'); return; }
    if (toTags.includes(val)) { setToError('Already added'); return; }
    setToTags((p) => [...p, val]);
    setToInput('');
    setToError('');
  }

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

  function removeTag(email: string) {
    setToTags((p) => p.filter((t) => t !== email));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  }

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

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();

    // commit any pending input before submitting
    const pending = toInput.trim();
    let finalTags = toTags;
    if (pending) {
      if (!isValidEmail(pending)) { setToError('Invalid email address'); return; }
      if (!toTags.includes(pending)) finalTags = [...toTags, pending];
      setToTags(finalTags);
      setToInput('');
    }

    if (finalTags.length === 0) {
      setToError('Add at least one recipient');
      toInputRef.current?.focus();
      return;
    }

    if (sendMode === 'scheduled' && !scheduledAt) {
      toast.error('Please pick a schedule date & time');
      return;
    }

    setSubmitting(true);
    try {
      await campaignsApi.create({
        name: form.name,
        subject: form.subject,
        htmlContent: form.htmlContent,
        recipients: finalTags,
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

  async function handleRetry(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    try { await campaignsApi.retry(id); toast.success('Retry initiated'); load(); }
    catch { toast.error('Failed to retry'); }
  }

  function promptDelete(e: React.MouseEvent, campaign: Campaign) {
    e.stopPropagation();
    setDeleteTarget(campaign);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget === 'bulk') {
        await campaignsApi.bulkRemove([...selected]);
        const ids = [...selected];
        toast.success(`${ids.length} campaigns deleted`);
        setCampaigns((p) => p.filter((c) => !ids.includes(c.id)));
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

  // Keep selected modal in sync with live campaign data
  const selectedLive = detailCampaign ? (campaigns.find((c) => c.id === detailCampaign.id) ?? detailCampaign) : null;

  const activeModeInfo = SEND_MODES.find((m) => m.mode === sendMode)!;

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-violet-400" />
            <span className="text-xs text-violet-400 font-medium uppercase tracking-wider">Email Campaigns</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Compose Form */}
      {showForm && (
        <div className="glass rounded-2xl border border-violet-500/20 mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Send size={14} className="text-violet-400" /> New Campaign
            </span>
            <button onClick={closeForm}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            {/* Name */}
            <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3">
              <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium">Name *</span>
              <input required placeholder="Campaign name (e.g. Summer Sale 2025)"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
            </div>

            {/* To field — Gmail-style tag input */}
            <div
              className={`px-5 py-2.5 border-b flex items-start gap-3 cursor-text transition-colors ${toError ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.04]'}`}
              onClick={() => toInputRef.current?.focus()}
            >
              <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium mt-1.5">To *</span>
              <div className="flex-1 flex flex-wrap gap-1.5 min-h-[28px]">
                {toTags.map((email) => (
                  <span key={email}
                    className="inline-flex items-center gap-1 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs rounded-md px-2 py-0.5">
                    {email}
                    <button type="button" onClick={() => removeTag(email)}
                      className="text-violet-400/60 hover:text-violet-300 transition-colors ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  ref={toInputRef}
                  type="text"
                  value={toInput}
                  onChange={(e) => { setToInput(e.target.value); setToError(''); }}
                  onKeyDown={handleToKeyDown}
                  onBlur={commitToInput}
                  placeholder={toTags.length === 0 ? 'Add recipients — press Enter, comma or Tab to add' : ''}
                  className="bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none min-w-[200px] flex-1 py-0.5"
                />
              </div>
              {toError && <span className="text-[11px] text-red-400 shrink-0 mt-1.5">{toError}</span>}
            </div>
            {toTags.length > 0 && (
              <div className="px-5 py-1.5 border-b border-white/[0.04] flex items-center gap-2">
                <span className="text-[11px] text-slate-600">{toTags.length} recipient{toTags.length > 1 ? 's' : ''}</span>
                <button type="button" onClick={() => setToTags([])}
                  className="text-[11px] text-slate-700 hover:text-red-400 transition-colors">clear all</button>
              </div>
            )}

            {/* Subject */}
            <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3">
              <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium">Subject *</span>
              <input required placeholder="Email subject line"
                value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
            </div>

            {/* Body */}
            <div className="px-5 py-3 border-b border-white/[0.04]">
              <textarea required placeholder="Write your email body here..."
                rows={8} value={form.htmlContent}
                onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none" />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="px-5 py-3 border-b border-white/[0.04] flex flex-wrap gap-2">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-300">
                    <Paperclip size={11} className="text-slate-500" />
                    <span className="max-w-[160px] truncate">{f.name}</span>
                    <span className="text-slate-600">({(f.size / 1024).toFixed(0)}KB)</span>
                    <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Send mode panels */}
            {sendMode === 'scheduled' && (
              <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3 bg-amber-500/5">
                <Clock size={13} className="text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-400 font-medium shrink-0">Start after</span>
                <input type="datetime-local" value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="bg-white/5 border border-amber-500/20 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500/50 [color-scheme:dark]" />
                <span className="text-[11px] text-slate-600">Sending begins at this time and continues until all recipients are reached.</span>
              </div>
            )}
            {sendMode === 'interval' && (
              <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3 bg-violet-500/5">
                <Shuffle size={13} className="text-violet-400 shrink-0" />
                <span className="text-[11px] text-violet-400 font-medium">Interval Send — emails will be sent at random intervals within the daily limit configured on the server.</span>
              </div>
            )}

            {/* Footer toolbar */}
            <div className="px-5 py-3 flex items-center justify-between">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                <Paperclip size={13} /> Attach
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />

              <div className="flex items-center gap-0 relative" ref={menuRef}>
                <button type="submit" disabled={submitting}
                  className="btn-primary rounded-r-none border-r border-white/10 h-9">
                  {submitting
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <activeModeInfo.icon size={14} className={activeModeInfo.color} />}
                  {activeModeInfo.label}
                </button>
                <button type="button" disabled={submitting}
                  onClick={() => setShowModeMenu((v) => !v)}
                  className="btn-primary rounded-l-none border-l-0 h-9 px-3">
                  <ChevronDown size={14} />
                </button>
                {showModeMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 glass rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden z-50">
                    {SEND_MODES.map(({ mode, label, desc, icon: Icon, color }) => (
                      <button key={mode} type="button"
                        onClick={() => { setSendMode(mode); setShowModeMenu(false); }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05] ${sendMode === mode ? 'bg-white/[0.04]' : ''}`}>
                        <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={15} /></div>
                        <div>
                          <p className={`text-xs font-semibold ${sendMode === mode ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                        {sendMode === mode && <div className="ml-auto mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Campaigns</span>
          <span className="text-xs text-slate-600">{campaigns.length} total</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Send size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No campaigns yet</p>
            {isAdmin && <p className="text-slate-700 text-xs mt-1">Create your first campaign to get started</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {isAdmin && (
                  <th className="px-5 py-3 w-10" onClick={toggleAll} style={{cursor:'pointer'}}>
                    <input type="checkbox" checked={allSelected} onChange={() => {}}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                  </th>
                )}
                {['Name', 'Subject', 'Recipients', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} onClick={() => setDetailCampaign(c)}
                  className={`table-row cursor-pointer transition-colors ${selected.has(c.id) ? 'bg-violet-500/5' : 'hover:bg-white/[0.03]'}`}>
                  {isAdmin && (
                    <td className="px-5 py-3.5" onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => {}}
                        className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                    </td>
                  )}
                  <td className="px-5 py-3.5 font-medium text-slate-200 text-sm">
                    <div className="flex items-center gap-1.5">
                      {c.name}
                      <ChevronRight size={12} className="text-slate-600" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">{c.subject}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {c.recipients.length === 0 ? (
                      <span className="text-slate-700">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {c.recipients.slice(0, 2).map((email) => (
                          <span key={email} className="bg-white/5 border border-white/[0.08] rounded px-1.5 py-0.5 truncate max-w-[140px]">{email}</span>
                        ))}
                        {c.recipients.length > 2 && (
                          <span className="text-slate-600 text-[11px] self-center">+{c.recipients.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${STATUS_STYLES[c.status] ?? 'bg-slate-500/15 text-slate-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {isAdmin && (
                      <button onClick={(e) => promptDelete(e, c)} title="Delete"
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailCampaign(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col glass rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">{selectedLive.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Created {new Date(selectedLive.createdAt).toLocaleString()}
                  {selectedLive.user && <span className="ml-2">by {selectedLive.user.name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge border ${STATUS_STYLES[selectedLive.status] ?? 'bg-slate-500/15 text-slate-400'}`}>
                  {selectedLive.status}
                </span>
                <button onClick={() => setDetailCampaign(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05]">
                <div className="px-5 py-3.5 flex items-center gap-2.5">
                  <FileText size={13} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Subject</p>
                    <p className="text-xs text-slate-300 mt-0.5 truncate max-w-[160px]">{selectedLive.subject}</p>
                  </div>
                </div>
                <div className="px-5 py-3.5 flex items-center gap-2.5">
                  <Users size={13} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Recipients</p>
                    <p className="text-xs text-slate-300 mt-0.5">{selectedLive.totalCount.toLocaleString()} contacts</p>
                  </div>
                </div>
                <div className="px-5 py-3.5 flex items-center gap-2.5">
                  <Calendar size={13} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Scheduled</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {selectedLive.scheduledAt ? new Date(selectedLive.scheduledAt).toLocaleString() : 'Immediate'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedLive.recipients.length > 0 && (
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                    To ({selectedLive.recipients.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {selectedLive.recipients.map((email) => (
                      <span key={email} className="bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-0.5 text-xs text-violet-300">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Email Content</p>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                  {selectedLive.htmlContent || <span className="text-slate-600">No content</span>}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
                <button onClick={(e) => promptDelete(e, selectedLive)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={(e) => { handleRetry(e, selectedLive.id); setDetailCampaign(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs transition-colors">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget === 'bulk' ? `Delete ${selected.size} campaigns?` : 'Delete campaign?'}
          message={deleteTarget === 'bulk'
            ? <><span className="text-slate-200 font-medium">{selected.size} campaigns</span> will be permanently deleted. This action cannot be undone.</>
            : <><span className="text-slate-200 font-medium">&ldquo;{deleteTarget.name}&rdquo;</span> will be permanently deleted. This action cannot be undone.</>}
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

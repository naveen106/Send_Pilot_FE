import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, Send, RefreshCw, X, Zap, Paperclip,
  ChevronDown, Clock, Shuffle, Zap as ZapIcon,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  SCHEDULED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  RUNNING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/15 text-red-400 border-red-500/20',
  PAUSED: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

type SendMode = 'immediate' | 'scheduled' | 'interval';

const SEND_MODES: { mode: SendMode; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { mode: 'immediate', label: 'Send Now',        desc: 'Deliver to all recipients immediately',                          icon: ZapIcon, color: 'text-emerald-400' },
  { mode: 'scheduled', label: 'Schedule Send',   desc: 'Start sending after a specific date & time',                    icon: Clock,   color: 'text-amber-400'  },
  { mode: 'interval',  label: 'Interval Send',   desc: 'Send at random intervals within daily limit (anti-spam)',       icon: Shuffle, color: 'text-violet-400' },
];

const EMPTY_FORM = { name: '', to: '', subject: '', htmlContent: '' };

export default function CampaignsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const location = useLocation();

  // pre-fill To from contacts page
  useEffect(() => {
    const state = location.state as { prefillTo?: string } | null;
    if (state?.prefillTo) {
      setForm((f) => ({ ...f, to: state.prefillTo! }));
      setShowForm(true);
      window.history.replaceState({}, '');
    }
  }, []);

  // send mode
  const [sendMode, setSendMode] = useState<SendMode>('immediate');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function load() {
    campaignsApi.getAll()
      .then((r) => setCampaigns(r.data.data.campaigns))
      .catch(() => toast.error('Failed to load campaigns'));
  }

  useEffect(() => { load(); }, []);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowModeMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  }

  function closeForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setAttachments([]);
    setSendMode('immediate');
    setScheduledAt('');
    setShowModeMenu(false);
  }

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (sendMode === 'scheduled' && !scheduledAt) {
      toast.error('Please pick a schedule date & time');
      return;
    }
    setSubmitting(true);
    try {
      await campaignsApi.create({
        ...form,
        scheduledAt: sendMode === 'scheduled' ? scheduledAt : undefined,
        sendMode,
        attachments: attachments.length ? attachments : undefined,
      } as any);
      toast.success(
        sendMode === 'immediate' ? 'Campaign sent!' :
        sendMode === 'scheduled' ? 'Campaign scheduled!' :
        'Interval campaign queued!'
      );
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSubmitting(false); }
  }

  async function handleSend(id: number) {
    try { await campaignsApi.sendNow(id); toast.success('Send initiated'); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  }

  async function handleRetry(id: number) {
    try { await campaignsApi.retry(id); toast.success('Retry initiated'); load(); }
    catch { toast.error('Failed to retry'); }
  }

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
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={15} /> New Campaign
          </button>
        )}
      </div>

      {/* Compose Form */}
      {showForm && (
        <div className="glass rounded-2xl border border-violet-500/20 mb-6 overflow-hidden">
          {/* Header */}
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

            {/* To */}
            <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-3">
              <span className="text-[11px] text-slate-500 w-16 shrink-0 font-medium">To *</span>
              <input required placeholder="recipient@example.com, another@example.com"
                value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
            </div>

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

            {/* Send mode config panel */}
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
              {/* Left: attach */}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                <Paperclip size={13} /> Attach
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />

              {/* Right: split send button */}
              <div className="flex items-center gap-0 relative" ref={menuRef}>
                {/* Main action */}
                <button type="submit" disabled={submitting}
                  className="btn-primary rounded-r-none border-r border-white/10 h-9">
                  {submitting
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <activeModeInfo.icon size={14} className={activeModeInfo.color} />}
                  {activeModeInfo.label}
                </button>

                {/* Dropdown toggle */}
                <button type="button" disabled={submitting}
                  onClick={() => setShowModeMenu((v) => !v)}
                  className="btn-primary rounded-l-none border-l-0 h-9 px-3">
                  <ChevronDown size={14} />
                </button>

                {/* Dropdown menu */}
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
                {['Name', 'Subject', 'To', 'Status', 'Sent', 'Failed', 'Scheduled', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3.5 font-medium text-slate-200 text-sm">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[140px] truncate">{c.subject}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">{c.to}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${STATUS_STYLES[c.status] ?? 'bg-slate-500/15 text-slate-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-emerald-400 font-medium text-sm">{c.sentCount}</td>
                  <td className="px-5 py-3.5 text-red-400 font-medium text-sm">{c.failedCount}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '—'}</td>
                  <td className="px-5 py-3.5">
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSend(c.id)} title="Send Now"
                          className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition-colors">
                          <Send size={13} />
                        </button>
                        <button onClick={() => handleRetry(c.id)} title="Retry Failed"
                          className="w-7 h-7 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 flex items-center justify-center transition-colors">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

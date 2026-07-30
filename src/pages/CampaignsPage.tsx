import { useEffect, useState } from 'react';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { Plus, Send, RefreshCw, X, ChevronRight, Zap } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  SCHEDULED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  RUNNING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/15 text-red-400 border-red-500/20',
  PAUSED: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

const EMPTY_FORM = { name: '', subject: '', htmlContent: '', scheduledAt: '' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    campaignsApi.getAll().then((r) => setCampaigns(r.data.data.campaigns)).catch(() => toast.error('Failed to load campaigns'));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await campaignsApi.create({ ...form, scheduledAt: form.scheduledAt || undefined });
      toast.success('Campaign created');
      setShowForm(false);
      setForm(EMPTY_FORM);
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
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Create Form Panel */}
      {showForm && (
        <div className="glass rounded-2xl border border-violet-500/20 p-6 mb-6 bg-gradient-to-br from-violet-600/5 to-transparent">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ChevronRight size={14} className="text-violet-400" /> New Campaign
            </h3>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Campaign Name *</label>
                <input required placeholder="e.g. Summer Sale 2025" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Email Subject *</label>
                <input required placeholder="e.g. Don't miss our biggest sale!" value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">HTML Content *</label>
              <textarea required placeholder="<h1>Hello {{name}}</h1>..." rows={5} value={form.htmlContent}
                onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
                className="input-field font-mono text-xs resize-none" />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="input-field [color-scheme:dark]" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary shrink-0">
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Create Campaign
              </button>
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
            <p className="text-slate-700 text-xs mt-1">Create your first campaign to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Name', 'Subject', 'Status', 'Sent', 'Failed', 'Total', 'Scheduled', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3.5 font-medium text-slate-200 text-sm">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[180px] truncate">{c.subject}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${STATUS_STYLES[c.status] ?? 'bg-slate-500/15 text-slate-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-emerald-400 font-medium text-sm">{c.sentCount}</td>
                  <td className="px-5 py-3.5 text-red-400 font-medium text-sm">{c.failedCount}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-sm">{c.totalCount}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '—'}</td>
                  <td className="px-5 py-3.5">
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

import { useState } from 'react';
import { Eye, Mail, RefreshCw, Send, Users, X, Clock, Shuffle } from 'lucide-react';
import { Campaign, SendMode } from '../../types';
import { getAssignedRecipients } from '../../utils/campaign';
import { SEND_MODES } from './SendModeMenu';
import { DEFAULT_24_HOUR_EMAIL_LIMIT, isValid24HourEmailLimit } from '../../constants/email';
import DailyLimitField from './DailyLimitField';

interface Props {
  campaign: Campaign;
  submitting: boolean;
  recipientEmails?: string[];
  retryMode?: boolean;
  onConfirm: (sendMode: SendMode, scheduledAt?: string, dailyLimit?: number) => void;
  onCancel: () => void;
}

/** Confirmation step for an assigned-only campaign send. */
export default function SendAssignedCampaignDialog({ campaign, submitting, recipientEmails, retryMode = false, onConfirm, onCancel }: Props) {
  const recipients = recipientEmails ?? getAssignedRecipients(campaign);
  const [sendMode, setSendMode] = useState<SendMode>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');
  const [dailyLimit, setDailyLimit] = useState<number | ''>(campaign.dailyLimit || DEFAULT_24_HOUR_EMAIL_LIMIT);
  const activeMode = SEND_MODES.find((item) => item.mode === sendMode)!;

  function confirm() {
    if (sendMode === 'scheduled' && !scheduledAt) return;
    if (typeof dailyLimit !== 'number' || !isValid24HourEmailLimit(dailyLimit)) return;
    onConfirm(sendMode, sendMode === 'scheduled' ? scheduledAt : undefined, dailyLimit);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => !submitting && onCancel()}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Send size={14} className={retryMode ? 'text-red-400' : 'text-emerald-400'} /> {retryMode ? 'Retry failed recipients' : 'Send to assigned contacts'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{retryMode ? 'Review the failed recipients before choosing how to retry them.' : 'Review the exact audience and message before queuing this campaign.'}</p>
          </div>
          <button onClick={onCancel} disabled={submitting} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-50">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users size={16} className="text-emerald-400" />
            </div>
            <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{retryMode ? 'Failed recipients' : 'Recipients'} ({recipients.length})</p>
              <p className="text-sm text-white font-medium">{campaign.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
            {recipients.map((email) => (
                <span key={email} className={`${retryMode ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'} border rounded-md px-2 py-1 text-xs`}>{email}</span>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5"><Mail size={12} /> Message</p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.06] text-sm text-slate-200">{campaign.subject}</div>
              <div className="p-4 max-h-56 overflow-y-auto text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">{campaign.htmlContent || 'No content'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Eye size={13} className={retryMode ? 'text-red-400' : 'text-emerald-400'} /> {retryMode ? 'Only the failed recipients listed above will be retried.' : 'Only the pending contacts assigned to this campaign will be sent this message.'}
          </div>

          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">Delivery</p>
            <div className="grid grid-cols-3 gap-2">
              {SEND_MODES.map(({ mode, label, desc, icon: Icon, color }) => (
                <button key={mode} type="button" disabled={submitting} onClick={() => setSendMode(mode)}
                  className={`text-left rounded-xl border p-3 transition-colors ${sendMode === mode ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                  <Icon size={14} className={color} />
                  <p className="text-xs font-semibold text-slate-200 mt-2">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </button>
              ))}
            </div>
            {sendMode === 'scheduled' && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                <Clock size={13} className="text-amber-400 shrink-0" />
                <label className="text-[11px] text-amber-300 shrink-0" htmlFor="assigned-send-schedule">Start after</label>
                <input id="assigned-send-schedule" type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setScheduledAt(e.target.value)}
                  className="bg-white/5 border border-amber-500/20 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none [color-scheme:dark]" />
              </div>
            )}
            {sendMode === 'interval' && <p className="mt-2 text-[11px] text-violet-300/80 flex items-center gap-1.5"><Shuffle size={12} /> Emails will use random intervals within the selected 24-hour limit.</p>}
          </div>

          <DailyLimitField id="assigned-daily-limit" value={dailyLimit} disabled={submitting} onChange={setDailyLimit} />
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-2">
          <button onClick={onCancel} disabled={submitting} className="btn-ghost text-xs py-2">Cancel</button>
          <button onClick={confirm} disabled={submitting || recipients.length === 0 || typeof dailyLimit !== 'number' || !isValid24HourEmailLimit(dailyLimit) || (sendMode === 'scheduled' && !scheduledAt)} className="btn-primary text-xs py-2">
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            {submitting ? 'Queueing...' : retryMode ? `${activeMode.label} retry (${recipients.length})` : `${activeMode.label} to ${recipients.length} contact${recipients.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

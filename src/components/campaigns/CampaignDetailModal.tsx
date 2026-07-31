import { X, FileText, Users, Calendar, Paperclip, Trash2, RefreshCw } from 'lucide-react';
import { Campaign } from '../../types';
import StatusBadge from '../StatusBadge';

interface Props {
  campaign: Campaign;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (e: React.MouseEvent, campaign: Campaign) => void;
  onRetry: (e: React.MouseEvent, id: number) => void;
}

/** Full-screen overlay showing campaign details with delete and retry actions. */
export default function CampaignDetailModal({ campaign, isAdmin, onClose, onDelete, onRetry }: Props) {
  return (
    // Clicking the backdrop closes the modal
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* stopPropagation prevents clicks inside the card from bubbling to the backdrop */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col glass rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Modal header: campaign name, creation meta, status badge, close button */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{campaign.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Created {new Date(campaign.createdAt).toLocaleString()}
              <span className="ml-2">by {campaign.user?.name ?? 'N/A'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={campaign.status} />
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* 3-column stats row: subject, recipient count, scheduled time */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05]">
            <div className="px-5 py-3.5 flex items-center gap-2.5">
              <FileText size={13} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Subject</p>
                <p className="text-xs text-slate-300 mt-0.5 truncate max-w-[160px]">{campaign.subject}</p>
              </div>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-2.5">
              <Users size={13} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Recipients</p>
                <p className="text-xs text-slate-300 mt-0.5">{campaign.totalCount.toLocaleString()} contacts</p>
              </div>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-2.5">
              <Calendar size={13} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Scheduled</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : 'Immediate'}
                </p>
              </div>
            </div>
          </div>

          {/* Full recipient list as violet chips — only shown when recipients exist */}
          {campaign.recipients.length > 0 && (
            <div className="px-6 py-4 border-b border-white/[0.05]">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                To ({campaign.recipients.length})
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {campaign.recipients.map((email) => (
                  <span key={email} className="bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-0.5 text-xs text-violet-300">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachment list — only shown when the campaign has files */}
          {campaign.attachments && campaign.attachments.length > 0 && (
            <div className="px-6 py-4 border-b border-white/[0.05]">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                Attachments ({campaign.attachments.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {campaign.attachments.map((a) => (
                  <span key={a.filename}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-300">
                    <Paperclip size={11} className="text-slate-500" />
                    {a.filename}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw email body — displayed in a monospace scrollable box */}
          <div className="px-6 py-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Email Content</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
              {campaign.htmlContent || <span className="text-slate-600">No content</span>}
            </div>
          </div>
        </div>

        {/* Footer action bar — delete on the left, retry on the right; admin-only */}
        {isAdmin && (
          <div className="px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
            <button onClick={(e) => onDelete(e, campaign)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">
              <Trash2 size={12} /> Delete
            </button>
            {/* Retry closes the modal immediately so the user can see the status update in the table */}
            <button onClick={(e) => { onRetry(e, campaign.id); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs transition-colors">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

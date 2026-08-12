import { useMemo, useState } from 'react';
import { X, FileText, Users, Paperclip, Trash2, RefreshCw, Send, Code2, Eye } from 'lucide-react';
import { Campaign } from '../../types';
import StatusBadge from '../StatusBadge';
import CampaignStatusNotice from './CampaignStatusNotice';
import RecipientChipList, { RecipientChip } from './RecipientChipList';
import { buildEmailPreviewDocument, htmlToPlainText } from '../../utils/htmlToPlainText';

interface Props {
  campaign: Campaign;
  isAdmin: boolean;
  canSend: boolean;
  onClose: () => void;
  onDelete: (e: React.MouseEvent, campaign: Campaign) => void;
  onRetry: (e: React.MouseEvent, campaign: Campaign) => void;
  onSend: (campaign: Campaign) => void;
}

/** Full-screen overlay showing campaign details with delete and retry actions. */
export default function CampaignDetailModal({ campaign, isAdmin, canSend, onClose, onDelete, onRetry, onSend }: Props) {
  type ContentTab = 'HTML' | 'text' | 'preview';
  const [contentTab, setContentTab] = useState<ContentTab>('preview');
  const assignedRecipients = campaign.assignedCampaigns ?? [];
  const sentDeliveries = campaign.sentDeliveries ?? [];
  const failedRecipients = campaign.failedRecipients ?? [];
  const canRetryFailed = canSend && failedRecipients.length > 0;
  const failedEmails = new Set(failedRecipients.map((recipient) => recipient.email.trim().toLowerCase()));
  const pendingRecipients = assignedRecipients.filter((assigned) => !failedEmails.has(assigned.contacts.email.trim().toLowerCase()));
  const sentItems: RecipientChip[] = sentDeliveries.map((delivery) => ({
    key: delivery.id,
    label: delivery.email,
    title: new Date(delivery.sentAt).toLocaleString(),
  }));
  const failedItems: RecipientChip[] = failedRecipients.map((recipient) => ({
    key: recipient.id,
    label: recipient.email,
    title: recipient.reason,
  }));
  const pendingItems: RecipientChip[] = pendingRecipients.map((assigned) => ({
    key: assigned.contacts.id,
    label: assigned.contacts.email,
  }));
  
  // Keep the modal read-only while reusing the same body conversion and
  // preview helpers used by the campaign composer.
  const plainTextContent = useMemo(() => htmlToPlainText(campaign.htmlContent), [campaign.htmlContent]);
  const previewDocument = useMemo(
    () => buildEmailPreviewDocument(campaign.htmlContent),
    [campaign.htmlContent],
  );
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

        <CampaignStatusNotice campaign={campaign} />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Campaign summary: subject and recipient count */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-b border-white/[0.05]">
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
          </div>

          {/* Durable delivery history; this is distinct from pending assignments. */}
          <div className="px-6 py-4 border-b border-white/[0.05]">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
              Sent To ({sentDeliveries.length})
            </p>
            <RecipientChipList items={sentItems} tone="success" emptyMessage="No emails sent yet." />
          </div>

          {failedRecipients.length > 0 && (
            <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/[0.03]">
              <p className="text-[11px] text-red-400 uppercase tracking-wider font-medium mb-2">
                <span className="flex items-center justify-between gap-3">
                  <span>Failed To ({failedRecipients.length})</span>
                  {canRetryFailed && (
                    <button onClick={(e) => onRetry(e, campaign)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 px-2 py-1 text-[10px] normal-case tracking-normal text-red-300 transition-colors">
                      <RefreshCw size={10} /> Retry
                    </button>
                  )}
                </span>
              </p>
              <RecipientChipList items={failedItems} tone="danger" emptyMessage="No failed recipients." />
            </div>
          )}

{/* Full assigned contacts list- only shown when they exist */}
          <div className="px-6 py-4 border-b border-white/[0.05]">
           <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                Assigned To ({pendingRecipients.length})
            </p>
              <RecipientChipList items={pendingItems} tone="pending" emptyMessage="No pending contacts are assigned to this campaign." />
            </div>
          
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

          {/* 'HTML', 'Text', 'Preview' email body displayed in a scrollable box */}
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Email Content</p>
              <div className="flex items-center gap-1">
                {([
                  { id: 'HTML', label: 'HTML', icon: Code2 },
                  { id: 'text', label: 'Text', icon: FileText },
                  { id: 'preview', label: 'Preview', icon: Eye },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setContentTab(id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${contentTab === id ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'}`}
                  >
                    {Icon && <Icon size={13} />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {contentTab === 'HTML' && (
              <pre className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words font-mono max-h-64 overflow-y-auto">
                {campaign.htmlContent || <span className="text-slate-600">No content</span>}
              </pre>
            )}

            {contentTab === 'text' && (
              <pre className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                {plainTextContent || <span className="text-slate-600">No content</span>}
              </pre>
            )}

            {contentTab === 'preview' && (
              <iframe
                title="Email content preview"
                srcDoc={previewDocument}
                sandbox=""
                className="block h-64 w-full rounded-xl border border-white/[0.06] bg-white"
              />
            )}
          </div>
        </div>

        {/* Footer action bar — delete on the left, retry on the right; admin-only */}
        {(isAdmin || (canSend && assignedRecipients.length > 0)) && (
          <div className="px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {isAdmin && <>
                <button onClick={(e) => onDelete(e, campaign)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">
                  <Trash2 size={12} /> Delete
                </button>
              </>}
            </div>
            <div className="flex items-center gap-2">
              {canSend && assignedRecipients.length > 0 && (
                <button onClick={() => onSend(campaign)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs transition-colors">
                  <Send size={12} /> Send assigned
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

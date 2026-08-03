import { useState } from 'react';
import { campaignsApi } from '../api';
import toast from 'react-hot-toast';
import { X, Send, RefreshCw, Check } from 'lucide-react';
import CampaignSelector from './CampaignSelector';

interface Props {
  contactCount: number;
  emails: string[];
  onClose: () => void;
  onAssigned?: () => void;
}

/** Assigns the selected contacts to one or more reusable campaigns. */
export default function AssignCampaignsModal({ contactCount, emails, onClose, onAssigned }: Props) {
  const [assigning, setAssigning] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<number>>(new Set());

  async function handleAssign() {
    if (selectedCampaignIds.size === 0) {
      toast.error('Select at least one campaign');
      return;
    }

    setAssigning(true);
    try {
      const response = await campaignsApi.assign([...selectedCampaignIds], emails);
      const results = response.data.data.campaigns ?? [];
      const skipped = results.filter((campaign: { skipped?: boolean }) => campaign.skipped).length;
      const assigned = selectedCampaignIds.size - skipped;
      toast.success(
        skipped > 0
          ? `${assigned} campaign${assigned === 1 ? '' : 's'} assigned; ${skipped} skipped because they are running`
          : `${assigned} campaign${assigned === 1 ? '' : 's'} assigned to ${contactCount} contact${contactCount === 1 ? '' : 's'}`
      );
      onAssigned?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign campaigns');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col glass rounded-2xl border border-violet-500/20 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Send size={16} className="text-violet-400" /> Assign Campaigns
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assign the selected contacts to one or more reusable campaigns.
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
          <CampaignSelector selectedCampaignIds={selectedCampaignIds} onChange={setSelectedCampaignIds} disabled={assigning} title="Campaigns" />
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-600">
            {selectedCampaignIds.size} campaign{selectedCampaignIds.size === 1 ? '' : 's'} selected • {contactCount} contact{contactCount === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-4">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={assigning || selectedCampaignIds.size === 0}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {assigning ? <><RefreshCw size={12} className="animate-spin" /> Assigning...</> : <><Check size={12} /> Assign campaigns</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

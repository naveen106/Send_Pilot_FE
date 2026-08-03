import { useEffect, useState } from 'react';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { X, Send, RefreshCw, Search, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';

interface Props {
  contactCount: number;
  emails: string[];
  onClose: () => void;
  onAssigned?: () => void;
}

/** Assigns the selected contacts to one or more reusable campaigns. */
export default function AssignCampaignsModal({ contactCount, emails, onClose, onAssigned }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
  });

  useEffect(() => {
    campaignsApi.getAll(1, 200)
      .then((r) => setCampaigns(r.data.data.campaigns ?? []))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  function toggleCampaign(id: number) {
    setSelectedCampaignIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

        <div className="px-5 py-3 border-b border-white/[0.05] shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns by name or subject..."
              className="input-field pl-9 py-2 text-xs"
              disabled={loading}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <RefreshCw size={14} className="animate-spin" /> Loading campaigns...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Send}
              message={campaigns.length === 0 ? 'No campaigns yet' : 'No matching campaigns'}
              hint={campaigns.length === 0 ? 'Create a campaign first, then reuse it here' : 'Try a different search'}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0d0d14]/90 backdrop-blur-sm z-10">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-5 py-3 w-10" />
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Campaign</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Recipients</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => {
                  const selected = selectedCampaignIds.has(campaign.id);
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => toggleCampaign(campaign.id)}
                      className={`table-row cursor-pointer ${selected ? 'bg-violet-500/5' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleCampaign(campaign.id)}
                          className="w-3.5 h-3.5 accent-violet-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-slate-200 text-sm font-medium truncate max-w-[200px]">{campaign.name}</p>
                        <p className="text-[11px] text-slate-600 truncate max-w-[200px] mt-0.5">{campaign.subject}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{(campaign.totalCount ?? campaign.recipients?.length ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-3"><StatusBadge status={campaign.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-600">
            {selectedCampaignIds.size} campaign{selectedCampaignIds.size === 1 ? '' : 's'} selected • {contactCount} contact{contactCount === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-4">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={loading || assigning || selectedCampaignIds.size === 0}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {loading || assigning ? <><RefreshCw size={12} className="animate-spin" /> {assigning ? 'Assigning...' : 'Loading...'}</> : <><Check size={12} /> Assign campaigns</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

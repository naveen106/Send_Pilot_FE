import { useEffect, useState } from 'react';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { RefreshCw, Search, Send } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

interface Props {
  selectedCampaignIds: Set<number>;
  onChange: (ids: Set<number>) => void;
  disabled?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  description?: string;
}

/** Reusable campaign multi-selector used by contact assignment workflows. */
export default function CampaignSelector({
  selectedCampaignIds,
  onChange,
  disabled = false,
  collapsible = false,
  defaultExpanded = true,
  title = 'Assign to campaigns',
  description,
}: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (collapsible && !expanded) return;
    setLoading(true);
    campaignsApi.getAll(page, PAGE_SIZE, search)
      .then((response) => {
        const data = response.data.data;
        if (page > 1 && (data.campaigns ?? []).length === 0) {
          setPage(page - 1);
          return;
        }
        setCampaigns(data.campaigns ?? []);
        setTotalCampaigns(data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, [collapsible, expanded, page, search]);

  function toggle(id: number) {
    const next = new Set(selectedCampaignIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
      <div className={`px-4 py-3 ${expanded ? 'border-b border-white/[0.05]' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Send size={13} className="text-violet-400" /> {title}</p>
            {description && <p className="text-[12.5px] text-slate-600 mt-1">{description}</p>}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-violet-300">{selectedCampaignIds.size} selected</span>
            {collapsible && <button type="button" onClick={() => setExpanded((value) => !value)} disabled={disabled}
              className="text-[10px] text-slate-500 hover:text-violet-300 transition-colors">
              {expanded ? 'HIDE' : 'SHOW'}
            </button>}
          </div>
        </div>
        {expanded && <div className="relative mt-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} disabled={loading || disabled}
            placeholder="Search campaigns by subject or name..." className="input-field pl-9 py-2 text-xs" />
        </div>}
      </div>

      {expanded && <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="py-10 flex justify-center items-center gap-2 text-slate-500 text-xs"><RefreshCw size={13} className="animate-spin" /> Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Send} message={search.trim() ? 'No matching campaigns' : 'No campaigns yet'} hint="Create a campaign first, then select it here" />
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {campaigns.map((campaign) => {
                const selected = selectedCampaignIds.has(campaign.id);
                return (
                  <tr key={campaign.id} onClick={() => !disabled && toggle(campaign.id)} className={`table-row cursor-pointer ${selected ? 'bg-violet-500/5' : ''}`}>
                    <td className="px-4 py-2.5 w-10">
                      <input type="checkbox" checked={selected} onChange={() => toggle(campaign.id)} disabled={disabled}
                        onClick={(event) => event.stopPropagation()} className="w-3.5 h-3.5 accent-violet-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs text-slate-200 font-medium truncate max-w-[280px]">{campaign.name}</p>
                      <p className="text-[11px] text-slate-600 truncate max-w-[280px]">{campaign.subject}</p>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500">{(campaign.totalCount ?? campaign.recipients?.length ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={campaign.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>}
      {expanded && <Pagination page={page} total={totalCampaigns} pageSize={PAGE_SIZE}
        onPageChange={setPage} disabled={loading || disabled} />}
    </div>
  );
}

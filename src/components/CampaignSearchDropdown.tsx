import { useEffect, useRef, useState } from 'react';
import { campaignsApi } from '../api';
import { Campaign } from '../types';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { htmlToTextPreview } from '../utils/htmlText';

interface Props {
  onSelect?: (campaign: Campaign) => void;
}

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 250;

/** Searchable, paginated campaign picker that dismisses when focus leaves it. */
export default function CampaignSearchDropdown({ onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [requestError, setRequestError] = useState(false);

  // The API returns the total matching count, so pagination stays accurate
  // even when the search result set is larger than the visible page.
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const open = focused && query.trim().length > 0;

  useEffect(() => {
    // Close the floating result panel whenever the user clicks outside the
    // component, including outside the input itself.
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    // Do not request anything until the user has entered a search term.
    if (!query.trim()) {
      setCampaigns([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // Debouncing prevents one network request per keystroke while typing.
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setRequestError(false);
      try {
        const response = await campaignsApi.getAll(page, PAGE_SIZE, query.trim());
        setCampaigns(response.data.data.campaigns ?? []);
        setTotal(response.data.data.total ?? 0);
      } catch {
        setCampaigns([]);
        setTotal(0);
        setRequestError(true);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [page, query]);

  function handleQueryChange(value: string) {
    // A new query always starts at page one; retaining the old page could
    // otherwise request a page that no longer exists for the new query.
    setQuery(value);
    setPage(1);
    setFocused(true);
  }

  function selectCampaign(campaign: Campaign) {
    // The parent decides what selecting a campaign means (currently it opens
    // the detail modal), which keeps this dropdown reusable elsewhere.
    onSelect?.(campaign);
    setFocused(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Search campaigns by name or subject..."
        className="input-field pl-9 pr-9 py-2.5 text-xs"
        aria-label="Search campaigns"
      />
      {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 animate-spin" />}

      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-2 glass rounded-xl border border-violet-500/20 shadow-2xl overflow-hidden">
          {requestError ? (
            <p className="px-4 py-5 text-xs text-red-400">Unable to search campaigns.</p>
          ) : loading && campaigns.length === 0 ? (
            <div className="px-4 py-5 flex items-center gap-2 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Searching...</div>
          ) : campaigns.length === 0 ? (
            <p className="px-4 py-5 text-xs text-slate-500">No campaigns found.</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <button key={campaign.id} type="button" onClick={() => selectCampaign(campaign)} className="w-full text-left px-4 py-3 hover:bg-violet-500/10 border-b border-white/[0.05] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{campaign.name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{campaign.subject}</p>
                        <p className="text-[11px] text-slate-600 truncate mt-1">{htmlToTextPreview(campaign.htmlContent) || 'No campaign content'}</p>
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="px-3 py-2 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-[10px] text-slate-600">{total} results</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)} className="p-1 text-slate-500 hover:text-white disabled:opacity-30"><ChevronLeft size={13} /></button>
                    {/* Show a small moving window of page numbers instead of
                        rendering dozens of buttons for large result sets. */}
                    {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), page + 1).map((pageNumber) => (
                      <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`min-w-5 h-5 rounded text-[10px] ${pageNumber === page ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-white'}`}>{pageNumber}</button>
                    ))}
                    <button type="button" disabled={page === totalPages || loading} onClick={() => setPage((current) => current + 1)} className="p-1 text-slate-500 hover:text-white disabled:opacity-30"><ChevronRight size={13} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

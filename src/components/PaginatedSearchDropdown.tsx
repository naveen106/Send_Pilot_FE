import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';

export interface SearchPage<T> {
  items: T[];
  total: number;
}

interface Props<T> {
  fetchPage: (query: string, page: number, pageSize: number) => Promise<SearchPage<T>>;
  renderItem: (item: T, selected: boolean) => ReactNode;
  getKey: (item: T) => string | number;
  onSelect: (item: T) => void;
  isSelected?: (item: T) => boolean;
  placeholder: string;
  emptyMessage: string;
  errorMessage: string;
  resultLabel: string;
}

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 250;

/** Generic debounced search dropdown with outside-click dismissal and pagination. */
export default function PaginatedSearchDropdown<T>({
  fetchPage,
  renderItem,
  getKey,
  onSelect,
  isSelected = () => false,
  placeholder,
  emptyMessage,
  errorMessage,
  resultLabel,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [requestError, setRequestError] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const open = focused && query.trim().length > 0;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // Debounce typing so the API is not called once per keystroke.
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setRequestError(false);
      try {
        const result = await fetchPage(query.trim(), page, PAGE_SIZE);
        setItems(result.items);
        setTotal(result.total);
      } catch {
        setItems([]);
        setTotal(0);
        setRequestError(true);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [fetchPage, page, query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
    setFocused(true);
  }

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => totalPages <= 7 || pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1);

  return (
    <div ref={containerRef} className="relative w-full">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input value={query} onChange={(event) => handleQueryChange(event.target.value)} onFocus={() => setFocused(true)}
        placeholder={placeholder} className="input-field pl-9 pr-9 py-2.5 text-xs" aria-label={placeholder} />
      {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 animate-spin" />}

      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-2 glass rounded-xl border border-violet-500/20 shadow-2xl overflow-hidden">
          {requestError ? (
            <p className="px-4 py-5 text-xs text-red-400">{errorMessage}</p>
          ) : loading && items.length === 0 ? (
            <div className="px-4 py-5 flex items-center gap-2 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Searching...</div>
          ) : items.length === 0 ? (
            <p className="px-4 py-5 text-xs text-slate-500">{emptyMessage}</p>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {items.map((item) => {
                  const selected = isSelected(item);
                  return <button key={getKey(item)} type="button" onClick={() => onSelect(item)} className="w-full text-left border-b border-white/[0.05] hover:bg-violet-500/10 transition-colors">{renderItem(item, selected)}</button>;
                })}
              </div>
              {totalPages > 1 && (
                <div className="px-3 py-2 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-[10px] text-slate-600">{total} {resultLabel}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)} className="p-1 text-slate-500 hover:text-white disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={13} /></button>
                    {visiblePages.map((pageNumber, index) => {
                      const previous = visiblePages[index - 1];
                      return <span key={pageNumber} className="flex items-center gap-1">{previous && pageNumber - previous > 1 && <span className="px-1 text-[10px] text-slate-600">…</span>}<button type="button" onClick={() => setPage(pageNumber)} className={`min-w-5 h-5 rounded text-[10px] ${pageNumber === page ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-white'}`}>{pageNumber}</button></span>;
                    })}
                    <button type="button" disabled={page === totalPages || loading} onClick={() => setPage((current) => current + 1)} className="p-1 text-slate-500 hover:text-white disabled:opacity-30" aria-label="Next page"><ChevronRight size={13} /></button>
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

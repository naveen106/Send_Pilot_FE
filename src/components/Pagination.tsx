import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Shared server-side pagination control for list/table views. */
export default function Pagination({ page, total, pageSize, onPageChange, disabled = false }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = totalPages <= 7
    ? pageNumbers
    : pageNumbers.filter((pageNumber) =>
        pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1
      );

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-4">
      <span className="text-xs text-slate-600">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={disabled || page === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none" aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        {visiblePages.map((pageNumber, index) => {
          const previous = visiblePages[index - 1];
          const needsGap = previous !== undefined && pageNumber - previous > 1;
          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {needsGap && <span className="px-1 text-xs text-slate-600">…</span>}
              <button type="button" onClick={() => onPageChange(pageNumber)} disabled={disabled} aria-current={pageNumber === page ? 'page' : undefined}
                className={`min-w-7 h-7 rounded-lg text-xs transition-colors ${pageNumber === page ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:bg-white/5 hover:text-white'} disabled:opacity-50`}>
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={disabled || page === totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none" aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

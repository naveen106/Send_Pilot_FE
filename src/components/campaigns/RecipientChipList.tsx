import { useState } from 'react';

export interface RecipientChip {
  key: string | number;
  label: string;
  title?: string;
}

type Tone = 'success' | 'danger' | 'pending';

interface Props {
  items: RecipientChip[];
  tone: Tone;
  emptyMessage: string;
}

const INITIAL_VISIBLE_COUNT = 12;

const TONE_STYLES: Record<Tone, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  danger: 'bg-red-500/10 border-red-500/25 text-red-300',
  pending: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
};

/** Compact recipient list that prevents large campaigns from flooding the modal. */
export default function RecipientChipList({ items, tone, emptyMessage }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const hasOverflow = items.length > INITIAL_VISIBLE_COUNT;

  if (items.length === 0) {
    return <span className="text-xs text-slate-600">{emptyMessage}</span>;
  }

  return (
    <>
      <div className={`flex flex-wrap gap-1.5 ${expanded && hasOverflow ? 'max-h-40 overflow-y-auto' : ''}`}>
        {visibleItems.map((item) => (
          <span key={item.key} title={item.title}
            className={`${TONE_STYLES[tone]} border rounded-md px-2 py-0.5 text-xs`}>
            {item.label}
          </span>
        ))}
      </div>
      {hasOverflow && (
        <button type="button" onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
          {expanded ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
    </>
  );
}

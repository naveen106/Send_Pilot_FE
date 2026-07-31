import { Send, ChevronRight, Trash2 } from 'lucide-react';
import { Campaign } from '../../types';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';

interface Props {
  campaigns: Campaign[];
  isAdmin: boolean;
  selected: Set<number>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleSelect: (id: number) => void;
  onRowClick: (campaign: Campaign) => void;
  onDelete: (e: React.MouseEvent, campaign: Campaign) => void;
}

/** Table listing all campaigns with optional multi-select and delete. */
export default function CampaignTable({
  campaigns, isAdmin, selected, allSelected,
  onToggleAll, onToggleSelect, onRowClick, onDelete,
}: Props) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Table header bar: title on the left, total count on the right */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Campaigns</span>
        <span className="text-xs text-slate-600">{campaigns.length} total</span>
      </div>

      {/* Empty state — shown when there are no campaigns yet */}
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          message="No campaigns yet"
          hint={isAdmin ? 'Create your first campaign to get started' : undefined}
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {/* Select-all checkbox — only rendered for admins */}
              {isAdmin && (
                <th className="px-5 py-3 w-10 cursor-pointer" onClick={onToggleAll}>
                  <input type="checkbox" checked={allSelected} onChange={() => {}}
                    className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                </th>
              )}
              {['Name', 'Subject', 'Recipients', 'Status', 'Created', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              // Clicking a row opens the detail modal; selected rows get a violet tint
              <tr key={c.id} onClick={() => onRowClick(c)}
                className={`table-row cursor-pointer transition-colors ${selected.has(c.id) ? 'bg-violet-500/5' : 'hover:bg-white/[0.03]'}`}>
                {/* Per-row checkbox — stopPropagation prevents the row click from also opening the modal */}
                {isAdmin && (
                  <td className="px-5 py-3.5" onClick={(e) => { e.stopPropagation(); onToggleSelect(c.id); }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => {}}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                  </td>
                )}
                <td className="px-5 py-3.5 font-medium text-slate-200 text-sm">
                  <div className="flex items-center gap-1.5">
                    {c.name}
                    <ChevronRight size={12} className="text-slate-600" />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">{c.subject}</td>
                {/* Recipients cell: shows first 2 emails as chips, then "+N more" overflow label */}
                <td className="px-5 py-3.5 text-slate-400 text-xs">
                  {c.recipients.length === 0 ? (
                    <span className="text-slate-700">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {c.recipients.slice(0, 2).map((email) => (
                        <span key={email} className="bg-white/5 border border-white/[0.08] rounded px-1.5 py-0.5 truncate max-w-[140px]">{email}</span>
                      ))}
                      {c.recipients.length > 2 && (
                        <span className="text-slate-600 text-[11px] self-center">+{c.recipients.length - 2} more</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                {/* Delete button — stopPropagation prevents the row click from firing */}
                <td className="px-5 py-3.5">
                  {isAdmin && (
                    <button onClick={(e) => onDelete(e, c)} title="Delete"
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Maps campaign status values to their Tailwind color classes. */
const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-slate-500/15 text-slate-400 border-slate-500/20',
  SCHEDULED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  RUNNING:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  FAILED:    'bg-red-500/15 text-red-400 border-red-500/20',
  PAUSED:    'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

interface Props {
  status: string;
}

/** Pill badge that renders a campaign status with the correct color. */
export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  return (
    <span className={`badge border ${style}`}>{status}</span>
  );
}

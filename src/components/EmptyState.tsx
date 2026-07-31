import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  message: string;
  hint?: string;
}

/** Centered empty-state block shown when a list has no items. */
export default function EmptyState({ icon: Icon, message, hint }: Props) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-slate-600" />
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
      {hint && <p className="text-slate-700 text-xs mt-1">{hint}</p>}
    </div>
  );
}

import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  title: string;
}

/** Consistent two-line page header: small icon+label above a bold title. */
export default function PageHeader({ icon: Icon, label, title }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-violet-400" />
        <span className="text-xs text-violet-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
    </div>
  );
}

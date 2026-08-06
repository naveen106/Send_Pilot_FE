import { ArrowUpRight, LucideIcon } from 'lucide-react';

export interface DashboardStatCardConfig {
  label: string;
  icon: LucideIcon;
  gradient: string;
  border: string;
  iconBackground: string;
  iconColor: string;
}

interface Props {
  config: DashboardStatCardConfig;
  value: number | null;
}

/** Reusable dashboard metric card with a matching loading state. */
export default function DashboardStatCard({ config, value }: Props) {
  const Icon = config.icon;

  return (
    <div className={`glass rounded-2xl p-5 border ${config.border} bg-gradient-to-br ${config.gradient} relative overflow-hidden group`}>
      {value === null ? (
        <>
          <div className="w-9 h-9 rounded-xl bg-white/5 mb-4 animate-pulse" />
          <div className="h-7 w-16 bg-white/5 rounded-lg mb-2 animate-pulse" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </>
      ) : (
        <>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={14} className="text-slate-500" />
          </div>
          <div className={`w-9 h-9 rounded-xl ${config.iconBackground} flex items-center justify-center mb-3`}>
            <Icon size={17} className={config.iconColor} />
          </div>
          <p className="text-xs text-slate-500 mb-1">{config.label}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import { DashboardStats } from '../types';
import { Mail, Send, Calendar, BarChart3, TrendingUp, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const cards = [
  { key: 'totalEmails', label: 'Total Emails', icon: Mail, gradient: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/20', icon_bg: 'bg-violet-500/20', icon_color: 'text-violet-400' },
  { key: 'sentToday', label: 'Sent Today', icon: Send, gradient: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/20', icon_bg: 'bg-emerald-500/20', icon_color: 'text-emerald-400' },
  { key: 'scheduledCampaigns', label: 'Scheduled', icon: Calendar, gradient: 'from-amber-600/20 to-amber-600/5', border: 'border-amber-500/20', icon_bg: 'bg-amber-500/20', icon_color: 'text-amber-400' },
  { key: 'totalCampaigns', label: 'Campaigns', icon: BarChart3, gradient: 'from-sky-600/20 to-sky-600/5', border: 'border-sky-500/20', icon_bg: 'bg-sky-500/20', icon_color: 'text-sky-400' },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load stats'));
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-violet-400" />
          <span className="text-xs text-violet-400 font-medium uppercase tracking-wider">Overview</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor your email campaigns at a glance.</p>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(({ key, label, icon: Icon, gradient, border, icon_bg, icon_color }) => (
            <div key={key} className={`glass rounded-2xl p-5 border ${border} bg-gradient-to-br ${gradient} relative overflow-hidden group`}>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={14} className="text-slate-500" />
              </div>
              <div className={`w-9 h-9 rounded-xl ${icon_bg} flex items-center justify-center mb-4`}>
                <Icon size={17} className={icon_color} />
              </div>
              <p className="text-2xl font-bold text-white">{stats[key].toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-32 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-white/5 mb-4" />
              <div className="h-7 w-16 bg-white/5 rounded-lg mb-2" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Quick tip */}
      <div className="glass rounded-2xl p-5 border border-violet-500/10 bg-gradient-to-r from-violet-600/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Send size={14} className="text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ready to send?</p>
            <p className="text-xs text-slate-500 mt-0.5">Create a campaign and import your contacts to start sending bulk emails.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

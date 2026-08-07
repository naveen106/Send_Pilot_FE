import { useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import { DashboardStats } from '../types';
import { Mail, Send, Calendar, BarChart3, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import DashboardStatCard, { DashboardStatCardConfig } from '../components/DashboardStatCard';

type StatKey = keyof DashboardStats;

interface DashboardCard extends DashboardStatCardConfig {
  key: StatKey;
}

// Card configuration keeps the dashboard layout consistent and makes new metrics easy to add.
const cards: DashboardCard[] = [
  { key: 'totalCampaigns', label: 'Campaigns', icon: BarChart3, gradient: 'from-sky-600/20 to-sky-600/5', border: 'border-sky-500/20', iconBackground: 'bg-sky-500/20', iconColor: 'text-sky-400' },
  { key: 'totalContacts', label: 'Contacts', icon: Users, gradient: 'from-rose-600/20 to-rose-600/5', border: 'border-rose-500/20', iconBackground: 'bg-rose-500/20', iconColor: 'text-rose-400' },
  { key: 'totalEmails', label: 'Total Emails', icon: Mail, gradient: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/20', iconBackground: 'bg-violet-500/20', iconColor: 'text-violet-400' },
  { key: 'sentToday', label: 'Sent Today', icon: Send, gradient: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/20', iconBackground: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
  { key: 'scheduledCampaigns', label: 'Scheduled', icon: Calendar, gradient: 'from-amber-600/20 to-amber-600/5', border: 'border-amber-500/20', iconBackground: 'bg-amber-500/20', iconColor: 'text-amber-400' },
];

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
        <PageHeader icon={TrendingUp} label="Overview" title="Dashboard" />
        <p className="text-slate-500 text-sm mt-1">Monitor your email campaigns at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => <DashboardStatCard key={card.key} config={card} value={stats ? stats[card.key] : null} />)}
      </div>

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

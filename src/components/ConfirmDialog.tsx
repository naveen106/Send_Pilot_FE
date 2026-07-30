import { RefreshCw } from 'lucide-react';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  icon: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', loading, icon, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => !loading && onCancel()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm glass rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        <div className="px-6 pt-6 pb-5">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-5 flex items-center gap-2 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-ghost text-xs py-1.5 px-4 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold transition-all disabled:opacity-50">
            {loading ? <RefreshCw size={12} className="animate-spin" /> : icon}
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

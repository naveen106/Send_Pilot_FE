import { useRef } from 'react';
import { RefreshCw, ChevronDown, Zap, Clock, Shuffle } from 'lucide-react';
import { SendMode } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';

// All available send modes with their display metadata
export const SEND_MODES: { mode: SendMode; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { mode: 'immediate', label: 'Send Now',      desc: 'Deliver to all recipients immediately',                    icon: Zap,     color: 'text-emerald-400' },
  { mode: 'scheduled', label: 'Schedule Send', desc: 'Start sending after a specific date & time',              icon: Clock,   color: 'text-amber-400'  },
  { mode: 'interval',  label: 'Interval Send', desc: 'Send at random intervals within daily limit (anti-spam)', icon: Shuffle, color: 'text-violet-400' },
];

interface Props {
  sendMode: SendMode;
  submitting: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (mode: SendMode) => void;
}

/** Split-button with a dropdown to pick the campaign send mode. */
export default function SendModeMenu({ sendMode, submitting, open, onToggle, onClose, onSelect }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  // Close the dropdown when the user clicks anywhere outside this component
  useClickOutside(menuRef, onClose);

  // Derive the active mode's display info to render on the submit button
  const active = SEND_MODES.find((m) => m.mode === sendMode)!;

  return (
    <div className="flex items-center gap-0 relative" ref={menuRef}>
      {/* Left half: submits the form; shows a spinner while the request is in-flight */}
      <button type="submit" disabled={submitting}
        className="btn-primary rounded-r-none border-r border-white/10 h-9">
        {submitting
          ? <RefreshCw size={14} className="animate-spin" />
          : <active.icon size={14} className={active.color} />}
        {active.label}
      </button>
      {/* Right half: toggles the mode selection dropdown */}
      <button type="button" disabled={submitting}
        onClick={onToggle}
        className="btn-primary rounded-l-none border-l-0 h-9 px-3">
        <ChevronDown size={14} />
      </button>

      {/* Dropdown menu — positioned above the button via bottom-full */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 glass rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden z-50">
          {SEND_MODES.map(({ mode, label, desc, icon: Icon, color }) => (
            <button key={mode} type="button"
              onClick={() => onSelect(mode)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05] ${sendMode === mode ? 'bg-white/[0.04]' : ''}`}>
              <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={15} /></div>
              <div>
                <p className={`text-xs font-semibold ${sendMode === mode ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              {/* Active mode indicator dot */}
              {sendMode === mode && <div className="ml-auto mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

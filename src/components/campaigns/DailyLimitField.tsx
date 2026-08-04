import { Gauge } from 'lucide-react';
import { MAX_24_HOUR_EMAIL_LIMIT } from '../../constants/email';

interface Props {
  id: string;
  value: number | '';
  disabled?: boolean;
  onChange: (value: number | '') => void;
}

/** Compact, editable 24-hour limit control shared by campaign workflows. */
export default function DailyLimitField({ id, value, disabled = false, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-violet-500/5 border border-violet-500/20 px-2.5 py-2">
      <label htmlFor={id} className="text-[11px] text-violet-200 font-medium flex items-center gap-1.5 whitespace-nowrap">
        <Gauge size={12} /> 24-hour limit
      </label>
      <input
        id={id}
        type="number"
        min={1}
        max={MAX_24_HOUR_EMAIL_LIMIT}
        step={1}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        className="w-16 bg-white/[0.06] border border-white/[0.12] text-slate-100 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-violet-500/50"
      />
      <span className="text-[10px] text-slate-500 whitespace-nowrap">1–{MAX_24_HOUR_EMAIL_LIMIT}</span>
    </div>
  );
}

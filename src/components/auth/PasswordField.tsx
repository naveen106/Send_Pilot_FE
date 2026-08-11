import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  value: string;
  placeholder: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}

/** Password input with an accessible show/hide control, reusable across auth forms. */
export default function PasswordField({ label, value, placeholder, autoComplete, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Lock size={13} className="text-slate-600" /> {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="input-field pr-11"
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

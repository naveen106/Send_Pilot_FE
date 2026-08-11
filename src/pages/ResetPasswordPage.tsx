import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { toast.error('This reset link is invalid or incomplete'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      window.setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'This reset link may have expired');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section className="glass rounded-3xl p-7 shadow-2xl shadow-black/20">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Password updated</h2>
            <p className="mt-2 text-sm text-slate-400">Your account is secure. Redirecting you to sign in...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><KeyRound size={21} /></div>
              <h2 className="text-xl font-semibold text-white">Create a new password</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Choose a strong password you haven&apos;t used before.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField label="New password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
              <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Repeat your new password" autoComplete="new-password" />
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-slate-400"><ShieldCheck size={16} className="shrink-0 text-emerald-400" /> Your password is protected with secure encryption.</div>
              <button type="submit" disabled={loading || !token} className="btn-primary mt-2 w-full">
                {loading && <Loader2 size={15} className="animate-spin" />} Update password
              </button>
            </form>
            <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-200"><ArrowLeft size={14} /> Back to sign in</Link>
          </>
        )}
      </section>
    </AuthShell>
  );
}

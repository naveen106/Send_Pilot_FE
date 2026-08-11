import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast.error(
        message ||
          'Server error: we could not send the reset email. Please try again later.',
        { duration: 6000 },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section className="glass rounded-3xl p-7 shadow-2xl shadow-black/20">
        {submitted ? (
          <div className="py-5 text-center">
            <CheckCircle2 size={42} className="mx-auto mb-4 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Check your inbox</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">
              If an account exists for <span className="text-slate-200">{email}</span>, we&apos;ve sent instructions to reset your password.
            </p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200">
              <ArrowLeft size={15} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Mail size={21} />
              </div>
              <h2 className="text-xl font-semibold text-white">Forgot your password?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Enter your email and we&apos;ll send you a secure link to choose a new password.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="recovery-email" className="mb-1.5 block text-[11px] font-medium text-slate-500">Email address</label>
                <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading && <Loader2 size={15} className="animate-spin" />} Send reset link
              </button>
            </form>
            <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-200">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        )}
      </section>
    </AuthShell>
  );
}

import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Lock, Mail } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(emailRef.current!.value.trim(), passwordRef.current!.value);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section className="glass rounded-3xl p-7 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-400">Sign in to continue to your workspace.</p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Mail size={13} className="text-slate-600" /> Email</label>
            <input id="login-email" ref={emailRef} type="email" required autoComplete="email" placeholder="you@example.com" className="input-field" />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><Lock size={13} className="text-slate-600" /> Password</label>
            <input id="login-password" ref={passwordRef} type="password" required autoComplete="current-password" placeholder="••••••••" className="input-field" />
          </div>
          <div className="flex justify-end pt-0.5">
            <Link to="/forgot-password" className="text-xs font-medium text-violet-300 transition-colors hover:text-violet-200">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 size={15} className="animate-spin" />} Sign In
          </button>
        </form>
      </section>
    </AuthShell>
  );
}

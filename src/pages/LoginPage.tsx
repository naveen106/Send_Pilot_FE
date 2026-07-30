import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSignIn(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(emailRef.current!.value.trim(), passwordRef.current!.value);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-4">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BulkMailer</h1>
          <p className="text-slate-500 text-xs mt-1 flex items-center justify-center gap-1">
            <Sparkles size={10} /> Bulk Email Management Platform
          </p>
        </div>

        <div className="glass rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                <span className="text-slate-600"><Mail size={13} /></span>Email
              </label>
              <input ref={emailRef} type="email" required placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                <span className="text-slate-600"><Lock size={13} /></span>Password
              </label>
              <input ref={passwordRef} type="password" required placeholder="••••••••" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null} Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-5">
          © {new Date().getFullYear()} BulkMailer. All rights reserved.
        </p>
      </div>
    </div>
  );
}

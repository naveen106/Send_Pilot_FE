import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { Lock, Loader2, Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!token) { toast.error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-4">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BulkMailer</h1>
        </div>

        <div className="glass rounded-2xl p-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-white font-semibold text-sm">Password updated!</p>
              <p className="text-slate-500 text-xs">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-sm mb-1">Set new password</h2>
              <p className="text-slate-500 text-xs mb-5">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                    <Lock size={12} /> New Password
                  </label>
                  <input type="password" required placeholder="Min. 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                    <Lock size={12} /> Confirm Password
                  </label>
                  <input type="password" required placeholder="Repeat password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : null} Update Password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

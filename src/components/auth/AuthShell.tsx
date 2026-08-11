import { ReactNode } from 'react';
import { Mail, Sparkles } from 'lucide-react';

/** Shared visual frame for public authentication screens. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] p-4">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-900/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">BulkMailer</h1>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
            <Sparkles size={10} /> Bulk Email Management Platform
          </p>
        </header>

        {children}

        <p className="mt-5 text-center text-[10px] text-slate-700">
          © {new Date().getFullYear()} BulkMailer. All rights reserved.
        </p>
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { smtpApi } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function SmtpPage() {
  const [config, setConfig] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    smtpApi.getConfig().then((r) => setConfig(r.data.data)).catch(() => toast.error('Failed to load SMTP config'));
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await smtpApi.test();
      setTestResult(res.data.success);
      toast[res.data.success ? 'success' : 'error'](res.data.message);
    } catch { toast.error('Test failed'); setTestResult(false); }
    finally { setTesting(false); }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">SMTP Settings</h2>

      {config ? (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Host:</span> <span className="font-medium ml-2">{config.host || '—'}</span></div>
            <div><span className="text-gray-500">Port:</span> <span className="font-medium ml-2">{config.port}</span></div>
            <div><span className="text-gray-500">User:</span> <span className="font-medium ml-2">{config.user || '—'}</span></div>
            <div><span className="text-gray-500">Secure:</span> <span className="font-medium ml-2">{config.secure ? 'Yes' : 'No'}</span></div>
            <div><span className="text-gray-500">Password:</span> <span className="font-medium ml-2">{config.passConfigured ? '••••••••' : 'Not set'}</span></div>
          </div>

          <p className="text-xs text-gray-400">SMTP credentials are managed via the <code>.env</code> file on the server.</p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {testing ? <Loader size={16} className="animate-spin" /> : null}
              Test Connection
            </button>

            {testResult !== null && (
              <div className={`flex items-center gap-2 text-sm ${testResult ? 'text-green-600' : 'text-red-500'}`}>
                {testResult ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {testResult ? 'Connection OK' : 'Connection Failed'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Loading...</div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { logsApi } from '../api';
import { AppLog } from '../types';
import toast from 'react-hot-toast';

const levelColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warn: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  debug: 'bg-gray-100 text-gray-600',
};

export default function AppLogsPage() {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [level, setLevel] = useState('');
  const [total, setTotal] = useState(0);

  function load(l = level) {
    logsApi.getLogs(1, l || undefined)
      .then((r) => { setLogs(r.data.data.logs); setTotal(r.data.data.total); })
      .catch(() => toast.error('Failed to load logs'));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">App Logs <span className="text-gray-400 text-lg">({total})</span></h2>
        <select value={level} onChange={(e) => { setLevel(e.target.value); load(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {['Time', 'Level', 'Message', 'Context'].map((h) => (
                <th key={h} className="px-6 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-xs">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${levelColors[log.level] || 'bg-gray-100'}`}>{log.level}</span>
                </td>
                <td className="px-6 py-3 max-w-lg truncate">{log.message}</td>
                <td className="px-6 py-3 text-gray-400">{log.context || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

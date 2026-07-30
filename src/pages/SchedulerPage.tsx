import { useEffect, useState } from 'react';
import { logsApi } from '../api';
import toast from 'react-hot-toast';
import { Play, Square } from 'lucide-react';

export default function SchedulerPage() {
  const [running, setRunning] = useState(false);

  function load() {
    logsApi.getScheduler().then((r) => setRunning(r.data.data.running)).catch(() => toast.error('Failed to load scheduler status'));
  }

  useEffect(() => { load(); }, []);

  async function toggle() {
    try {
      await logsApi.toggleScheduler(!running);
      toast.success(`Scheduler ${!running ? 'started' : 'stopped'}`);
      load();
    } catch { toast.error('Failed to toggle scheduler'); }
  }

  return (
    <div className="p-8 max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scheduler</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Background Scheduler</p>
            <p className="text-sm text-gray-500 mt-1">Automatically processes scheduled campaigns every minute</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {running ? 'Running' : 'Stopped'}
          </div>
        </div>

        <button
          onClick={toggle}
          className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-lg text-white ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {running ? <><Square size={16} /> Stop Scheduler</> : <><Play size={16} /> Start Scheduler</>}
        </button>
      </div>
    </div>
  );
}

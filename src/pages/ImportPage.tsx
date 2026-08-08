import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactsApi } from '../api';
import PageHeader from '../components/PageHeader';
import CampaignSelector from '../components/campaigns/CampaignSelector';

export default function ImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<number>>(new Set());

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setImportFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  }

  async function handleImport(assign = false) {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }
    if (assign && selectedCampaignIds.size === 0) {
      toast.error('Select at least one campaign to assign');
      return;
    }

    setImporting(true);
    try {
      const response = await contactsApi.import(importFile, assign ? [...selectedCampaignIds] : []);
      const data = response.data.data;
      const assigned = data.assignment?.totalAdded ?? 0;
      toast.success(assign
        ? `Imported ${data.imported}, skipped ${data.skipped}; assigned ${assigned} new contact${assigned === 1 ? '' : 's'}`
        : `Imported ${data.imported}, skipped ${data.skipped}`);
      setImportFile(null);
      setSelectedCampaignIds(new Set());
      navigate('/contacts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || (assign ? 'Assign and import failed' : 'Import failed'));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader icon={Upload} label="Contact List" title="Import Contacts" />

      <div className="glass rounded-2xl border border-violet-500/20 overflow-hidden mt-6">
        <div className="flex items-center px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent">
          <span className="text-sm font-semibold text-white flex items-center gap-2"><Upload size={14} className="text-violet-400" /> Import Contacts</span>
        </div>

        <div className="p-6 space-y-5">
          <div onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${importFile ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.02]'}`}>
            <FileSpreadsheet size={32} className={`mx-auto mb-3 ${importFile ? 'text-violet-400' : 'text-slate-600'}`} />
            {importFile ? (
              <div>
                <p className="text-sm font-medium text-slate-200">{importFile.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(importFile.size / 1024).toFixed(0)} KB</p>
                <button type="button" onClick={(event) => { event.stopPropagation(); setImportFile(null); }} className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
              </div>
            ) : (
              <div><p className="text-sm text-slate-400">Click to select or drop your file here</p><p className="text-xs text-slate-600 mt-1">Supports .xlsx, .xls, .csv</p></div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

          <CampaignSelector
            selectedCampaignIds={selectedCampaignIds}
            onChange={setSelectedCampaignIds}
            disabled={importing}
            collapsible
            defaultExpanded={false}
            description="Choose campaigns now if these imported contacts should be assigned immediately."
          />

          <div className="glass rounded-xl p-4 border border-white/[0.06]">
            <p className="text-xs font-semibold text-slate-400 mb-2">Expected file format</p>
            <div className="grid grid-cols-2 gap-2">{[['Column A', 'email (required)'], ['Column B', 'name (optional)']].map(([column, description]) => <div key={column} className="flex items-center gap-2"><span className="text-[11px] font-mono bg-white/5 border border-white/[0.08] px-2 py-0.5 rounded text-violet-300">{column}</span><span className="text-[11px] text-slate-500">{description}</span></div>)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleImport(false)} disabled={importing || !importFile} className="btn-ghost w-full justify-center">
              {importing ? <><RefreshCw size={14} className="animate-spin" /> Importing...</> : <><Upload size={14} /> Import Contacts</>}
            </button>
            <button onClick={() => handleImport(true)} disabled={importing || !importFile || selectedCampaignIds.size === 0} className="btn-primary w-full justify-center">
              {importing ? <><RefreshCw size={14} className="animate-spin" /> Importing...</> : <><Upload size={14} /> Assign and Import</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

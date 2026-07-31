import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { contactsApi } from '../api';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, X, Upload, Send, FileSpreadsheet } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useSelection } from '../hooks/useSelection';

const EMPTY_ROW = { email: '', name: '' };

export default function ContactsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const tab = location.pathname === '/imports' ? 'import' : 'contacts';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [submitting, setSubmitting] = useState(false);
  const { selected, toggle: toggleSelect, toggleAll, clear: clearSelected, allSelected, someSelected } = useSelection(contacts);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | 'bulk' | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    contactsApi.getAll().then((r) => {
      setContacts(r.data.data.contacts);
      setTotal(r.data.data.total);
    }).catch(() => toast.error('Failed to load contacts'));
  }

  useEffect(() => { load(); }, []);

  // ── Add contacts ──────────────────────────────────────────────────────────
  function addRow() { setRows((p) => [...p, { ...EMPTY_ROW }]); }
  function removeRow(i: number) { setRows((p) => p.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: 'email' | 'name', value: string) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const valid = rows.filter((r) => r.email.trim());
    if (!valid.length) { toast.error('Add at least one email'); return; }
    setSubmitting(true);
    try {
      await Promise.all(valid.map((r) => contactsApi.add(r.email.trim(), r.name.trim() || undefined)));
      toast.success(`${valid.length} contact${valid.length > 1 ? 's' : ''} added`);
      setRows([{ ...EMPTY_ROW }]);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add contacts');
    } finally { setSubmitting(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget === 'bulk') {
        await contactsApi.bulkRemove([...selected]);
        toast.success(`${selected.size} contacts deleted`);
      } else {
        await contactsApi.remove(deleteTarget.id);
        toast.success('Contact deleted');
      }
      clearSelected();
      load();
      setDeleteTarget(null);
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  }

  function handleSendCampaign() {
    const emails = contacts.filter((c) => selected.has(c.id)).map((c) => c.email);
    navigate('/campaigns', { state: { prefillTo: emails.join(', ') } });
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  }

  async function handleImport() {
    if (!importFile) { toast.error('Please select a file'); return; }
    setImporting(true);
    try {
      const res = await contactsApi.import(importFile);
      toast.success(`Imported ${res.data.data.imported}, skipped ${res.data.data.skipped}`);
      setImportFile(null);
      load();
      navigate('/contacts');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <PageHeader icon={Users} label="Contact List" title="Contacts" />
          <span className="text-slate-600 text-sm font-normal -mt-1 block">{total.toLocaleString()} total</span>
        </div>
        {someSelected && (
          <div className="flex items-center gap-2">
            <button onClick={() => setDeleteTarget('bulk')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors">
              <Trash2 size={13} /> Delete {selected.size}
            </button>
            <button onClick={handleSendCampaign} className="btn-primary">
              <Send size={14} /> Send Campaign to {selected.size}
            </button>
          </div>
        )}
      </div>

      {/* ── CONTACTS TAB ── */}
      {tab === 'contacts' && (
        <>
          {/* Add form */}
          <div className="glass rounded-2xl border border-violet-500/20 mb-6 overflow-hidden">
            <div className="flex items-center px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus size={14} className="text-violet-400" /> Add Contacts
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-5 pt-3 pb-1 flex items-center gap-3">
                <span className="text-[11px] text-slate-600 font-medium w-8 shrink-0">#</span>
                <span className="text-[11px] text-slate-600 font-medium flex-1">Email *</span>
                <span className="text-[11px] text-slate-600 font-medium flex-1">Name (optional)</span>
                <span className="w-6 shrink-0" />
              </div>
              <div className="px-5 pb-3 space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600 w-8 shrink-0 text-center">{i + 1}</span>
                    <input type="email" required placeholder="email@example.com" value={row.email}
                      onChange={(e) => updateRow(i, 'email', e.target.value)} className="input-field flex-1" />
                    <input type="text" placeholder="John Doe" value={row.name}
                      onChange={(e) => updateRow(i, 'name', e.target.value)} className="input-field flex-1" />
                    <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors disabled:opacity-20 shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
                <button type="button" onClick={addRow}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                  <Plus size={13} /> Add another
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  <Plus size={14} /> Save Contacts
                </button>
              </div>
            </form>
          </div>

          {/* Contacts table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Contacts</span>
              <span className="text-xs text-slate-600">{contacts.length} shown</span>
            </div>
            {contacts.length === 0 ? (
              <EmptyState icon={Users} message="No contacts yet" hint="Add contacts using the form above" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="px-5 py-3 w-10 cursor-pointer" onClick={toggleAll}>
                      <input type="checkbox" checked={allSelected} onChange={() => {}}
                        className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                    </th>
                    {['Email', 'Name', 'Added', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className={`table-row ${selected.has(c.id) ? 'bg-violet-500/5' : ''}`}>
                      <td className="px-5 py-3.5" onClick={() => toggleSelect(c.id)}>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => {}}
                          className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none" />
                      </td>
                      <td className="px-5 py-3.5 text-slate-200 text-sm font-medium">{c.email}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-sm">{c.name || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setDeleteTarget(c)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── IMPORT TAB ── */}
      {tab === 'import' && (
        <div className="glass rounded-2xl border border-violet-500/20 overflow-hidden">
          <div className="flex items-center px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 to-transparent">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Upload size={14} className="text-violet-400" /> Import Contacts
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                importFile ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.02]'
              }`}>
              <FileSpreadsheet size={32} className={`mx-auto mb-3 ${importFile ? 'text-violet-400' : 'text-slate-600'}`} />
              {importFile ? (
                <div>
                  <p className="text-sm font-medium text-slate-200">{importFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(importFile.size / 1024).toFixed(0)} KB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400">Click to select or drop your file here</p>
                  <p className="text-xs text-slate-600 mt-1">Supports .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

            {/* Format hint */}
            <div className="glass rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs font-semibold text-slate-400 mb-2">Expected file format</p>
              <div className="grid grid-cols-2 gap-2">
                {[['Column A', 'email (required)'], ['Column B', 'name (optional)']].map(([col, desc]) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-white/5 border border-white/[0.08] px-2 py-0.5 rounded text-violet-300">{col}</span>
                    <span className="text-[11px] text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleImport} disabled={importing || !importFile} className="btn-primary w-full">
              {importing ? 'Importing...' : <><Upload size={14} /> Import Contacts</>}
            </button>
          </div>
        </div>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget === 'bulk' ? `Delete ${selected.size} contacts?` : 'Delete contact?'}
          message={deleteTarget === 'bulk'
            ? <><span className="text-slate-200 font-medium">{selected.size} contacts</span> will be permanently deleted. This action cannot be undone.</>
            : <><span className="text-slate-200 font-medium">{deleteTarget.email}</span> will be permanently deleted. This action cannot be undone.</>}
          confirmLabel="Yes, delete"
          icon={<Trash2 size={18} className="text-red-400" />}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

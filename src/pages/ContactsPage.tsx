import { useEffect, useState, useRef } from 'react';
import { contactsApi } from '../api';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import { Upload, Plus, Trash2, Copy, Search, Users } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function load(s = search) {
    contactsApi.getAll(1, s).then((r) => {
      setContacts(r.data.data.contacts);
      setTotal(r.data.data.total);
    }).catch(() => toast.error('Failed to load contacts'));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: { preventDefault(): void }) {
    e.preventDefault();
    try {
      await contactsApi.add(newEmail, newName || undefined);
      toast.success('Contact added');
      setNewEmail(''); setNewName('');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this contact?')) return;
    try { await contactsApi.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await contactsApi.importCSV(file);
      toast.success(`Imported ${res.data.data.imported}, skipped ${res.data.data.skipped}`);
      load();
    } catch { toast.error('Import failed'); }
    finally { e.target.value = ''; }
  }

  async function handleDeduplicate() {
    try {
      const res = await contactsApi.deduplicate();
      toast.success(`Removed ${res.data.data.removed} duplicates`);
      load();
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-violet-400" />
            <span className="text-xs text-violet-400 font-medium uppercase tracking-wider">Contact List</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Contacts <span className="text-slate-600 text-lg font-normal ml-1">{total.toLocaleString()}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDeduplicate} className="btn-ghost">
            <Copy size={13} /> Deduplicate
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload size={13} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        </div>
      </div>

      {/* Add Contact + Search Row */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleAdd} className="flex gap-2 flex-1">
          <input placeholder="Email address *" required type="email" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)} className="input-field flex-1" />
          <input placeholder="Name (optional)" value={newName}
            onChange={(e) => setNewName(e.target.value)} className="input-field w-44" />
          <button type="submit" className="btn-primary shrink-0">
            <Plus size={14} /> Add
          </button>
        </form>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
            className="input-field pl-8 w-52"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Contacts</span>
          <span className="text-xs text-slate-600">{contacts.length} shown</span>
        </div>
        {contacts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No contacts found</p>
            <p className="text-slate-700 text-xs mt-1">Add contacts manually or import a CSV file</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Email', 'Name', 'Status', 'Added', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="px-5 py-3.5 text-slate-200 text-sm font-medium">{c.email}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm">{c.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge border ${c.isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(c.id)}
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
    </div>
  );
}

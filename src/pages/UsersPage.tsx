import { useEffect, useState } from 'react';
import { usersApi, authApi } from '../api';
import { User, Role } from '../types';
import toast from 'react-hot-toast';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'USER'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'USER' as Role });

  function load() {
    usersApi.getAll().then((r) => setUsers(r.data.data)).catch(() => toast.error('Failed to load users'));
  }

  useEffect(() => { load(); }, []);

  async function handleRegister(e: { preventDefault(): void }) {
    e.preventDefault();
    try {
      await authApi.register(form);
      toast.success('User created');
      setShowForm(false);
      setForm({ email: '', password: '', name: '', role: 'USER' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  }

  async function handleRoleChange(id: number, role: Role) {
    try {
      await usersApi.updateRole(id, role);
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
  }

  async function handleToggle(id: number) {
    try {
      await usersApi.toggleStatus(id);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to toggle status'); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-sm p-6 mb-6 grid grid-cols-2 gap-4">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border rounded-lg px-3 py-2" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="border rounded-lg px-3 py-2">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create User</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${(u as any).isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {(u as any).isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleToggle(u.id)} className="text-gray-500 hover:text-blue-600">
                    {(u as any).isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

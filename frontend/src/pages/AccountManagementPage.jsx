import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', type: 'apartment_admin', apartmentId: '' });
  const [editForm, setEditForm] = useState({ type: 'apartment_admin', apartmentId: '' });
  const [pwForm, setPwForm] = useState({ userId: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwOpen, setPwOpen] = useState(false);
  const [changeOwnPw, setChangeOwnPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAccounts = () => {
    setLoading(true);
    setError(null);
    const query = debouncedSearch;
    api.get('/admin/accounts' + (query ? `?search=${encodeURIComponent(query)}` : ''))
      .then((r) => setAccounts(r.data || []))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load accounts');
        toast.error('Failed to load accounts');
      });
    api.get('/admin/apartments')
      .then((r) => setApartments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, [debouncedSearch]);

  const openCreate = () => {
    setForm({ name: '', identifier: '', password: '', type: 'apartment_admin', apartmentId: '' });
    setCreateOpen(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setEditForm({ type: a.type || 'apartment_admin', apartmentId: a.apartmentId?._id || a.apartmentId || '' });
    setEditOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/accounts', form);
      toast.success('Account created');
      setCreateOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/accounts/${editItem._id}`, editForm);
      toast.success('Account updated');
      setEditOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account');
    }
  };

  const toggleStatus = async (a) => {
    try {
      const newStatus = a.status === 'active' ? 'inactive' : 'active';
      await api.put(`/admin/accounts/${a._id}`, { status: newStatus });
      toast.success(`Account ${newStatus}`);
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/accounts/${confirmId}`);
      toast.success('Account deleted');
      setConfirmOpen(false);
      setConfirmId(null);
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete account');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const openChangePassword = (a) => {
    setPwForm({ userId: a._id, currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwOpen(true);
  };

  const handleChangeUserPassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/users/${pwForm.userId}/change-password`, { newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (changeOwnPw.newPassword !== changeOwnPw.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (changeOwnPw.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post('/auth/change-password', { newPassword: changeOwnPw.newPassword });
      toast.success('Password changed');
      setChangeOwnPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  const showType = accounts.filter((a) => a.type !== 'site_admin');

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Account Management */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Account Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage user accounts and permissions</p>
          </div>
          <Button onClick={openCreate}>+ Create Account</Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button onClick={fetchAccounts} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
          </div>
        )}

        <div className="mb-4">
          <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identifier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Apartment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {showType.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No accounts found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                showType.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{a.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.identifier}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">{ROLE_LABELS[a.type] || a.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.apartmentId?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => toggleStatus(a)} className={`px-2.5 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{a.status}</button>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => { setViewItem(a); setViewOpen(true); }} className="text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">View</button>
                        <button onClick={() => openEdit(a)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
                        <button onClick={() => openChangePassword(a)} className="text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 transition-colors">Password</button>
                        <button onClick={() => { setConfirmId(a._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Your Password */}
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-4">Change Your Password</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 max-w-md">
          <form onSubmit={handleChangeOwnPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <input type="password" required minLength={6} value={changeOwnPw.newPassword} onChange={(e) => setChangeOwnPw({ ...changeOwnPw, newPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
              <input type="password" required value={changeOwnPw.confirmPassword} onChange={(e) => setChangeOwnPw({ ...changeOwnPw, confirmPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <Button type="submit" className="w-full">Change Password</Button>
          </form>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Account" message="Delete this account permanently?" confirmText="Delete" danger />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Login ID / Username</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="apartment_admin">Apartment Admin</option>
              <option value="resident">Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apartment</label>
            <select required value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">Select apartment...</option>
              {apartments.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Account: ${editItem?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account Type</label>
            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="apartment_admin">Apartment Admin</option>
              <option value="resident">Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apartment</label>
            <select value={editForm.apartmentId} onChange={(e) => setEditForm({ ...editForm, apartmentId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">Select apartment...</option>
              {apartments.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Update</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change User Password">
        <form onSubmit={handleChangeUserPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
            <input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Change</Button>
            <Button type="button" variant="secondary" onClick={() => setPwOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={viewItem?.name || 'Account Details'}>
        {viewItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[['Name', viewItem.name], ['Identifier', viewItem.identifier], ['Type', viewItem.type], ['Apartment', viewItem.apartmentId?.name || '-'], ['Status', viewItem.status], ['Email', viewItem.email || '-'], ['Phone', viewItem.phone?.join(', ') || '-'], ['Identity', viewItem.identityNumber || '-'], ['Custom Role', viewItem.customRole || '-']].map(([label, value]) => (
                <div key={label}>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className="block mt-1 text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setViewOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

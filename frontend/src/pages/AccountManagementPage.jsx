import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', type: 'apartment_admin', apartmentId: '' });
  const [editForm, setEditForm] = useState({ type: 'apartment_admin', apartmentId: '' });
  const [pwForm, setPwForm] = useState({ userId: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwOpen, setPwOpen] = useState(false);
  const [changeOwnPw, setChangeOwnPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const fetchAccounts = () => {
    api.get('/admin/accounts').then((r) => {
      setAccounts(r.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchAccounts();
    api.get('/admin/apartments').then((r) => setApartments(r.data)).catch(() => {});
  }, []);

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this account permanently?')) return;
    try {
      await api.delete(`/admin/accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete account');
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
      await api.post(`/auth/change-password`, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
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
      await api.put('/auth/change-password', { currentPassword: changeOwnPw.currentPassword, newPassword: changeOwnPw.newPassword });
      toast.success('Password changed');
      setChangeOwnPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  const showType = accounts.filter((a) => a.type !== 'site_admin');

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Account Management */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Create Account</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identifier</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Apartment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {showType.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-gray-600">{a.identifier}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">{ROLE_LABELS[a.type] || a.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{a.apartmentId?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(a)} className={`px-2 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(a)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => openChangePassword(a)} className="text-sm text-yellow-600 hover:text-yellow-800 font-medium">Password</button>
                    <button onClick={() => handleDelete(a._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showType.length === 0 && <p className="text-center text-gray-500 py-8">No accounts found</p>}
        </div>
      </div>

      {/* Change Your Password */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Change Your Password</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
          <form onSubmit={handleChangeOwnPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" required value={changeOwnPw.currentPassword} onChange={(e) => setChangeOwnPw({ ...changeOwnPw, currentPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" required minLength={6} value={changeOwnPw.newPassword} onChange={(e) => setChangeOwnPw({ ...changeOwnPw, newPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" required value={changeOwnPw.confirmPassword} onChange={(e) => setChangeOwnPw({ ...changeOwnPw, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Change Password</button>
          </form>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login ID / Username</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="apartment_admin">Apartment Admin</option>
              <option value="resident">Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
            <select required value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select apartment...</option>
              {apartments.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create</button>
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Account: ${editItem?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="apartment_admin">Apartment Admin</option>
              <option value="resident">Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
            <select value={editForm.apartmentId} onChange={(e) => setEditForm({ ...editForm, apartmentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select apartment...</option>
              {apartments.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Update</button>
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change User Password">
        <form onSubmit={handleChangeUserPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Change</button>
            <button type="button" onClick={() => setPwOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

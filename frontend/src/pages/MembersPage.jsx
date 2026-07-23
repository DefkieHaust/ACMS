import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import Button from '../components/Button';

const roleBadgeColors = {
  committee_head: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  committee_member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ userId: '', role: 'committee_member', customRole: '' });
  const [editForm, setEditForm] = useState({ role: 'committee_member', customRole: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [customRoles, setCustomRoles] = useState([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const fetchMembers = () => {
    if (user?.committeeId) {
      setLoading(true);
      setError(null);
      api.get(`/committees/${user.committeeId}/members`)
        .then((r) => setMembers(r.data))
        .catch((e) => {
          setError(e.response?.data?.error || 'Failed to load members');
          toast.error('Failed to load members');
        })
        .finally(() => setLoading(false));
    }
  };

  const fetchCustomRoles = () => {
    if (user?.committeeId) {
      api.get(`/committees/${user.committeeId}/roles`)
        .then((r) => setCustomRoles(r.data))
        .catch(() => {});
    }
  };

  useEffect(() => { fetchMembers(); fetchCustomRoles(); }, [user?.committeeId]);

  useEffect(() => {
    if (user?.apartmentId) {
      api.get(`/apartment/residents`)
        .then((r) => setAllUsers(r.data || []))
        .catch(() => {});
    }
  }, [user?.apartmentId]);

  const openAdd = () => {
    setForm({ userId: '', role: 'committee_member', customRole: '' });
    setModalOpen(true);
  };

  const openEditRole = (m) => {
    setEditMember(m);
    setEditForm({ role: m.role || 'committee_member', customRole: m.customRole || m.userId?.customRole || '' });
    setEditModalOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/committees/${user.committeeId}/members`, form);
      toast.success('Member added');
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      if (editForm.customRole !== (editMember.customRole || editMember.userId?.customRole || '')) {
        await api.put(`/committees/${user.committeeId}/members/${editMember._id}/role`, { customRole: editForm.customRole });
      }
      await api.put(`/committees/${user.committeeId}/members/${editMember._id}`, { role: editForm.role });
      toast.success('Role updated');
      setEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      await api.post(`/committees/${user.committeeId}/roles`, { name: newRoleName.trim() });
      toast.success('Custom role created');
      setNewRoleName('');
      setRoleModalOpen(false);
      fetchCustomRoles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Delete this custom role?')) return;
    try {
      await api.delete(`/committees/${user.committeeId}/roles/${roleId}`);
      toast.success('Role deleted');
      fetchCustomRoles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete role');
    }
  };

  const removeMember = async () => {
    try {
      await api.delete(`/committees/${user.committeeId}/members/${confirmId}`);
      toast.success('Member removed');
      setConfirmOpen(false);
      setConfirmId(null);
      fetchMembers();
    } catch (err) {
      toast.error('Failed to remove member');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const availableUsers = allUsers.filter((u) => !members.find((m) => m.userId?._id === u._id || m._id === u._id));

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mt-2 animate-pulse" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Committee Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage committee members and roles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setNewRoleName(''); setRoleModalOpen(true); }} variant="secondary">Manage Roles</Button>
          <Button onClick={openAdd}>+ Add Member</Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchMembers} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identifier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom Role</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {members.map((m) => (
              <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{m.userId?.name || m.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.userId?.identifier || m.identifier}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${roleBadgeColors[m.role] || roleBadgeColors.committee_member}`}>
                    {m.role === 'committee_head' ? 'Head' : ROLE_LABELS[m.role] || 'Member'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{m.customRole || m.userId?.customRole || '-'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditRole(m)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Change Role</button>
                  {m.role !== 'committee_head' && (
                    <button onClick={() => { setConfirmId(m._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No members yet</p>
          </div>
        )}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={removeMember} title="Remove Member" message="Remove this member?" confirmText="Remove" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Committee Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select User</label>
            <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">Select a user...</option>
              {availableUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.identifier})</option>)}
            </select>
            {availableUsers.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No available users. All residents are already members.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="committee_member">Committee Member</option>
              <option value="committee_head">Committee Head</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Custom Role</label>
            <select value={form.customRole} onChange={(e) => setForm({ ...form, customRole: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">None</option>
              {customRoles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Change Role: ${editMember?.userId?.name || editMember?.name}`}>
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="committee_member">Committee Member</option>
              <option value="committee_head">Committee Head</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Custom Role</label>
            <select value={editForm.customRole} onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">None</option>
              {customRoles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Update</Button>
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Custom Roles">
        <div className="space-y-4">
          <form onSubmit={handleCreateRole} className="flex gap-2">
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name..." className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            <Button type="submit" size="sm">Add</Button>
          </form>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {customRoles.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No custom roles defined yet</p>}
            {customRoles.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</span>
                <button onClick={() => handleDeleteRole(r._id)} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

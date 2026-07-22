import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

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

  if (loading) return <LoadingSkeleton lines={6} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Committee Members</h1>
        <div className="flex gap-2">
          <button onClick={() => { setNewRoleName(''); setRoleModalOpen(true); }} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Manage Roles</button>
          <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Add Member</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchMembers} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identifier</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Custom Role</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{m.userId?.name || m.name}</td>
                <td className="px-6 py-4 text-gray-600">{m.userId?.identifier || m.identifier}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${m.role === 'committee_head' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.role === 'committee_head' ? 'Head' : ROLE_LABELS[m.role] || 'Member'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{m.customRole || m.userId?.customRole || '-'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditRole(m)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Change Role</button>
                  {m.role !== 'committee_head' && (
                    <button onClick={() => { setConfirmId(m._id); setConfirmOpen(true); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && <p className="text-center text-gray-500 py-8">No members yet</p>}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={removeMember} title="Remove Member" message="Remove this member?" confirmText="Remove" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Committee Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select a user...</option>
              {availableUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.identifier})</option>)}
            </select>
            {availableUsers.length === 0 && <p className="text-xs text-gray-500 mt-1">No available users. All residents are already members.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="committee_member">Committee Member</option>
              <option value="committee_head">Committee Head</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Role</label>
            <select value={form.customRole} onChange={(e) => setForm({ ...form, customRole: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">None</option>
              {customRoles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Change Role: ${editMember?.userId?.name || editMember?.name}`}>
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="committee_member">Committee Member</option>
              <option value="committee_head">Committee Head</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Role</label>
            <select value={editForm.customRole} onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">None</option>
              {customRoles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Update</button>
            <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Custom Roles">
        <div className="space-y-4">
          <form onSubmit={handleCreateRole} className="flex gap-2">
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add</button>
          </form>
          <div className="divide-y divide-gray-100">
            {customRoles.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No custom roles defined yet</p>}
            {customRoles.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-900">{r.name}</span>
                <button onClick={() => handleDeleteRole(r._id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ userId: '', role: 'committee_member' });
  const [editForm, setEditForm] = useState({ role: 'committee_member' });

  const fetchMembers = () => {
    if (user?.committeeId) {
      api.get(`/committees/${user.committeeId}/members`).then((r) => setMembers(r.data));
    }
  };

  useEffect(() => { fetchMembers(); }, [user?.committeeId]);

  useEffect(() => {
    if (user?.apartmentId) {
      api.get(`/apartment/residents`).then((r) => {
        setAllUsers(r.data || []);
      }).catch(() => {});
    }
  }, [user?.apartmentId]);

  const openAdd = () => {
    setForm({ userId: '', role: 'committee_member' });
    setModalOpen(true);
  };

  const openEditRole = (m) => {
    setEditMember(m);
    setEditForm({ role: m.role || 'committee_member' });
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
      await api.put(`/committees/${user.committeeId}/members/${editMember._id}`, editForm);
      toast.success('Role updated');
      setEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/committees/${user.committeeId}/members/${memberId}`);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const availableUsers = allUsers.filter((u) => !members.find((m) => m.userId?._id === u._id || m._id === u._id));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Committee Members</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Add Member</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identifier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
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
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditRole(m)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Change Role</button>
                  {m.role !== 'committee_head' && (
                    <button onClick={() => removeMember(m._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && <p className="text-center text-gray-500 py-8">No members yet</p>}
      </div>

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
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Update</button>
            <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

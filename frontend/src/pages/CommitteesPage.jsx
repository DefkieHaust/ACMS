import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function CommitteesPage() {
  const [committees, setCommittees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [headForm, setHeadForm] = useState({ name: '', identifier: '', password: '' });

  useEffect(() => { api.get('/apartment/committees').then((r) => setCommittees(r.data)); }, []);

  const createCommittee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/apartment/committees', form);
      toast.success('Committee created');
      setModalOpen(false);
      setForm({ name: '' });
      const r = await api.get('/apartment/committees');
      setCommittees(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create committee');
    }
  };

  const openHeadModal = (committee) => {
    setSelectedCommittee(committee);
    setHeadForm({ name: '', identifier: '', password: '' });
    setHeadModalOpen(true);
  };

  const createHead = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/apartment/committees/${selectedCommittee._id}/head`, headForm);
      toast.success('Committee head created');
      setHeadModalOpen(false);
      const r = await api.get('/apartment/committees');
      setCommittees(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create head');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Committees</h1>
        <button onClick={() => { setForm({ name: '' }); setModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ New Committee</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {committees.map((c) => (
          <div key={c._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Head: {c.headUserId?.name || 'Not assigned'}</p>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              {!c.headUserId && (
                <button onClick={() => openHeadModal(c)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Set Head</button>
              )}
            </div>
          </div>
        ))}
        {committees.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">No committees yet. Create your first committee.</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Committee">
        <form onSubmit={createCommittee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maintenance Committee" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={headModalOpen} onClose={() => setHeadModalOpen(false)} title={`Assign Head: ${selectedCommittee?.name}`}>
        <form onSubmit={createHead} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={headForm.name} onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Staff ID</label>
            <input type="text" required value={headForm.identifier} onChange={(e) => setHeadForm({ ...headForm, identifier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={headForm.password} onChange={(e) => setHeadForm({ ...headForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create</button>
            <button type="button" onClick={() => setHeadModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

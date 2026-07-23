import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import { RESIDENT_TYPES } from '../utils/constants';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', unitId: '', residentType: 'tenant', phone: '', identityNumber: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/apartment/residents')
      .then((r) => setResidents(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load residents');
        toast.error('Failed to load residents');
      });
    api.get('/apartment/units')
      .then((r) => setUnits(r.data.filter((u) => u.status === 'vacant')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', identifier: '', password: '', unitId: '', residentType: 'tenant', phone: '', identityNumber: '' });
    setEditOpen(true);
  };

  const openEdit = (r) => {
    setEditItem(r);
    setForm({ name: r.name, identifier: r.identifier, password: '', unitId: r.unitId?._id || '', residentType: r.residentType || 'tenant', phone: Array.isArray(r.phone) ? r.phone.join(', ') : r.phone || '', identityNumber: r.identityNumber || '' });
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/apartment/residents/${editItem._id}`, { name: form.name, unitId: form.unitId || null, residentType: form.residentType, phone: form.phone ? form.phone.split(',').map(p => p.trim()) : [], identityNumber: form.identityNumber });
        toast.success('Resident updated');
      } else {
        await api.post('/apartment/residents', { ...form, phone: form.phone ? form.phone.split(',').map(p => p.trim()) : [], type: 'resident' });
        toast.success('Resident created');
      }
      setEditOpen(false);
      const r = await api.get('/apartment/residents');
      setResidents(r.data);
      const u = await api.get('/apartment/units');
      setUnits(u.data.filter((u) => u.status === 'vacant'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/apartment/residents/${confirmId}`);
      toast.success('Resident deleted');
      setResidents(residents.filter((r) => r._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete resident');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-48 skeleton-shimmer rounded-lg" />
      </div>
      <div className="h-64 skeleton-shimmer rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Residents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage apartment residents and their units</p>
        </div>
        <Button onClick={openCreate}>+ Add Resident</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identifier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {residents.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{r.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.identifier}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400"><span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 capitalize">{r.residentType || 'tenant'}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{Array.isArray(r.phone) ? r.phone.join(', ') : r.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.identityNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.unitNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  <Badge status={r.status} />
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <button onClick={() => openEdit(r)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors mr-3">Edit</button>
                  <button onClick={() => { setConfirmId(r._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {residents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No data found</p>
          </div>
        )}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Resident" message="Delete this resident?" confirmText="Delete" danger />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Resident' : 'Add Resident'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Login ID (unit/apartment number)</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="e.g. B-204" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password{editItem && ' (leave blank to keep)'}</label>
            <input type="password" required={!editItem} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Resident Type</label>
            <select value={form.residentType} onChange={(e) => setForm({ ...form, residentType: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              {RESIDENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number(s) (comma separated)</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +1234567890, +1987654321" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Identity Number (SSN/ID/Passport)</label>
            <input type="text" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign Unit</label>
            <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">No unit</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.unitNumber} (Vacant)</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

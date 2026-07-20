import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { RESIDENT_TYPES } from '../utils/constants';

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', unitId: '', residentType: 'tenant', phone: '', identityNumber: '' });

  useEffect(() => {
    api.get('/apartment/residents').then((r) => setResidents(r.data));
    api.get('/apartment/units').then((r) => setUnits(r.data.filter((u) => u.status === 'vacant')));
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
        await api.post('/apartment/residents', { ...form, type: 'resident' });
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this resident?')) return;
    try {
      await api.delete(`/apartment/residents/${id}`);
      toast.success('Resident deleted');
      setResidents(residents.filter((r) => r._id !== id));
    } catch (err) {
      toast.error('Failed to delete resident');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Add Resident</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identifier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identity</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {residents.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                <td className="px-6 py-4 text-gray-600">{r.identifier}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 capitalize">{r.residentType || 'tenant'}</span></td>
                <td className="px-6 py-4 text-gray-600">{Array.isArray(r.phone) ? r.phone.join(', ') : r.phone || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{r.identityNumber || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{r.unitNumber || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(r)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mr-3">Edit</button>
                  <button onClick={() => handleDelete(r._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {residents.length === 0 && <p className="text-center text-gray-500 py-8">No residents yet</p>}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Resident' : 'Add Resident'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login ID (unit/apartment number)</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="e.g. B-204" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password{editItem && ' (leave blank to keep)'}</label>
            <input type="password" required={!editItem} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resident Type</label>
            <select value={form.residentType} onChange={(e) => setForm({ ...form, residentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {RESIDENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number(s) (comma separated)</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +1234567890, +1987654321" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identity Number (SSN/ID/Passport)</label>
            <input type="text" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Unit</label>
            <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">No unit</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.unitNumber} (Vacant)</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save</button>
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

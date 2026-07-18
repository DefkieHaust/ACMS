import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', planId: '' });
  const [adminForm, setAdminForm] = useState({ name: '', identifier: '', password: '' });

  useEffect(() => {
    api.get('/admin/apartments').then((r) => setApartments(r.data));
    api.get('/admin/plans').then((r) => setPlans(r.data));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', address: '', planId: '' });
    setEditOpen(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ name: a.name, address: a.address, planId: a.planId?._id || '' });
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const payload = { address: form.address, planId: form.planId || null };
        await api.put(`/admin/apartments/${editItem._id}`, payload);
        toast.success('Apartment updated');
      } else {
        await api.post('/admin/apartments', form);
        toast.success('Apartment created');
      }
      setEditOpen(false);
      const r = await api.get('/admin/apartments');
      setApartments(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const toggleStatus = async (a) => {
    try {
      const newStatus = a.status === 'active' ? 'suspended' : 'active';
      await api.put(`/admin/apartments/${a._id}`, { status: newStatus });
      toast.success(`Apartment ${newStatus}`);
      const r = await api.get('/admin/apartments');
      setApartments(r.data);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/apartment-admins', { ...adminForm, apartmentId: selectedApt._id, type: 'apartment_admin' });
      toast.success(`Admin created for ${selectedApt.name}`);
      setAdminOpen(false);
      setAdminForm({ name: '', identifier: '', password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ New Apartment</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apartments.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                <td className="px-6 py-4 text-gray-600">{a.address}</td>
                <td className="px-6 py-4 text-gray-600">{a.planId?.name || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(a)} className={`px-2 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(a)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                  <button onClick={() => { setSelectedApt(a); setAdminForm({ name: '', identifier: '', password: '' }); setAdminOpen(true); }} className="text-sm text-green-600 hover:text-green-800 font-medium">Create Admin</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apartments.length === 0 && <p className="text-center text-gray-500 py-8">No apartments yet</p>}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Apartment' : 'New Apartment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required disabled={!!editItem} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">No plan</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (${p.price}/{p.priceType})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save</button>
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} title={`Create Admin for ${selectedApt?.name || ''}`}>
        <form onSubmit={createAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Login ID</label>
            <input type="text" required value={adminForm.identifier} onChange={(e) => setAdminForm({ ...adminForm, identifier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create Admin</button>
            <button type="button" onClick={() => setAdminOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

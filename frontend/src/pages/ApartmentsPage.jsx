import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';
import { CURRENCIES, APARTMENT_TYPES } from '../utils/constants';
import Button from '../components/Button';

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', planId: '' });
  const [adminForm, setAdminForm] = useState({ name: '', identifier: '', password: '', phone: '', identityNumber: '' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchApartments = () => {
    setLoading(true);
    setError(null);
    const query = debouncedSearch;
    api.get('/admin/apartments' + (query ? `?search=${encodeURIComponent(query)}` : ''))
      .then((r) => setApartments(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load apartments');
        toast.error('Failed to load apartments');
      });
    api.get('/admin/plans')
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApartments(); }, [debouncedSearch]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', address: '', planId: '', city: '', country: '', apartmentType: 'residential', defaultCurrency: 'USD' });
    setEditOpen(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ name: a.name, address: a.address, planId: a.planId?._id || '', city: a.city || '', country: a.country || '', apartmentType: a.apartmentType || 'residential', defaultCurrency: a.defaultCurrency || 'USD' });
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        const payload = { address: form.address, planId: form.planId || null, city: form.city, country: form.country, apartmentType: form.apartmentType, defaultCurrency: form.defaultCurrency };
        await api.put(`/admin/apartments/${editItem._id}`, payload);
        toast.success('Apartment updated');
      } else {
        const payload = { ...form };
        await api.post('/admin/apartments', payload);
        toast.success('Apartment created');
      }
      setEditOpen(false);
      fetchApartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const toggleStatus = async (a) => {
    try {
      const newStatus = a.status === 'active' ? 'suspended' : 'active';
      await api.put(`/admin/apartments/${a._id}`, { status: newStatus });
      toast.success(`Apartment ${newStatus}`);
      fetchApartments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/apartments/${confirmId}`);
      toast.success('Apartment deleted');
      setApartments(apartments.filter((a) => a._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete apartment');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: adminForm.name,
        identifier: adminForm.identifier,
        password: adminForm.password,
        phone: adminForm.phone ? adminForm.phone.split(',').map(p => p.trim()) : [],
        identityNumber: adminForm.identityNumber || undefined,
        apartmentId: selectedApt._id,
        type: 'apartment_admin',
      };
      await api.post('/admin/apartment-admins', payload);
      toast.success(`Admin created for ${selectedApt.name}`);
      setAdminOpen(false);
      setAdminForm({ name: '', identifier: '', password: '', phone: '', identityNumber: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin');
    }
  };

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
        <Button onClick={openCreate}>+ New Apartment</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchApartments} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="mb-4">
        <input type="text" placeholder="Search apartments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Country</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
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
                <td className="px-6 py-4 text-gray-600">{a.city || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{a.country || '-'}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{a.apartmentType || 'residential'}</span></td>
                <td className="px-6 py-4 text-gray-600">{a.planId?.name || '-'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(a)} className={`px-2 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => openEdit(a)} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Edit</button>
                    <button onClick={() => { setConfirmId(a._id); setConfirmOpen(true); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
                    <button onClick={() => { setSelectedApt(a); setAdminForm({ name: '', identifier: '', password: '' }); setAdminOpen(true); }} className="text-sm text-green-600 hover:text-green-800 font-medium">Create Admin</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apartments.length === 0 && <p className="text-center text-gray-500 py-8">No apartments yet</p>}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Apartment" message="Delete this apartment permanently? This cannot be undone." confirmText="Delete" danger />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Apartment' : 'New Apartment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required disabled={!!editItem} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.apartmentType} onChange={(e) => setForm({ ...form, apartmentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {APARTMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">No plan</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name} (${p.price}/{p.priceType})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} title={`Create Admin for ${selectedApt?.name || ''}`}>
        <form onSubmit={createAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Login ID</label>
            <input type="text" required value={adminForm.identifier} onChange={(e) => setAdminForm({ ...adminForm, identifier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number(s) (comma separated)</label>
            <input type="text" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="e.g. +1234567890" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identity Number</label>
            <input type="text" value={adminForm.identityNumber} onChange={(e) => setAdminForm({ ...adminForm, identityNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create Admin</Button>
            <Button type="button" variant="secondary" onClick={() => setAdminOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

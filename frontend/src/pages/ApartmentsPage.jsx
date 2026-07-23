import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

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

  const openView = (a) => {
    setViewItem(a);
    setViewOpen(true);
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Apartments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage apartment buildings and properties</p>
        </div>
        <Button onClick={openCreate}>+ New Apartment</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchApartments} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div>
        <input type="text" placeholder="Search apartments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {apartments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No apartments yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              apartments.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.city || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.country || '-'}</td>
                  <td className="px-6 py-4 text-sm"><span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{a.apartmentType || 'residential'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.planId?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => toggleStatus(a)} className={`px-2.5 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{a.status}</button>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex flex-col gap-1 items-end">
                      <button onClick={() => openView(a)} className="text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">View</button>
                      <button onClick={() => openEdit(a)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
                      <button onClick={() => { setConfirmId(a._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
                      <button onClick={() => { setSelectedApt(a); setAdminForm({ name: '', identifier: '', password: '' }); setAdminOpen(true); }} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 transition-colors">Create Admin</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Apartment" message="Delete this apartment permanently? This cannot be undone." confirmText="Delete" danger />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Apartment' : 'New Apartment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input type="text" required disabled={!!editItem} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select value={form.apartmentType} onChange={(e) => setForm({ ...form, apartmentType: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                {APARTMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Currency</label>
              <select value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plan</label>
            <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input type="text" required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username / Login ID</label>
            <input type="text" required value={adminForm.identifier} onChange={(e) => setAdminForm({ ...adminForm, identifier: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" required value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number(s) (comma separated)</label>
            <input type="text" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="e.g. +1234567890" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Identity Number</label>
            <input type="text" value={adminForm.identityNumber} onChange={(e) => setAdminForm({ ...adminForm, identityNumber: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create Admin</Button>
            <Button type="button" variant="secondary" onClick={() => setAdminOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={viewItem?.name || 'Apartment Details'}>
        {viewItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[['Name', viewItem.name], ['Status', viewItem.status], ['Address', viewItem.address], ['City', viewItem.city || '-'], ['Country', viewItem.country || '-'], ['Type', viewItem.apartmentType || 'residential'], ['Currency', viewItem.defaultCurrency || 'USD'], ['Plan', viewItem.planId?.name || 'None']].map(([label, value]) => (
                <div key={label}>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className="block mt-1 text-gray-900 dark:text-white capitalize">{value}</span>
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

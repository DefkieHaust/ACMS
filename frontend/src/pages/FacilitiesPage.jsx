import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';

export default function FacilitiesPage() {
  const { user } = useAuth();
  const isAdmin = user?.type === ROLES.APARTMENT_ADMIN;
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', capacity: '', available: true });

  const fetchFacilities = () => {
    setLoading(true);
    setError(null);
    api.get('/facilities')
      .then((r) => setFacilities(r.data))
      .catch((e) => { setError(e.response?.data?.error || 'Failed to load facilities'); toast.error('Failed to load facilities'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFacilities(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', capacity: '', available: true });
    setModalOpen(true);
  };

  const openEdit = (facility) => {
    setEditing(facility);
    setForm({ name: facility.name, description: facility.description || '', capacity: String(facility.capacity), available: facility.available });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) {
        await api.put(`/facilities/${editing._id}`, payload);
        toast.success('Facility updated');
      } else {
        await api.post('/facilities', payload);
        toast.success('Facility created');
      }
      setModalOpen(false);
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save facility');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this facility? All related bookings will also be removed.')) return;
    try {
      await api.delete(`/facilities/${id}`);
      toast.success('Facility deleted');
      fetchFacilities();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete facility');
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="h-5 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-3/4 mb-3" />
            <div className="h-4 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-1/2 mb-4" />
            <div className="h-4 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Facilities</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage community facilities and amenities</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>Add Facility</Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchFacilities} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      {facilities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No facilities yet{isAdmin ? '. Click "Add Facility" to create one.' : ''}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <Card key={f._id} hover>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{f.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Capacity: {f.capacity}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${f.available ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {f.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {f.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{f.description}</p>}
              {isAdmin && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => openEdit(f)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(f._id)} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Facility' : 'Add Facility'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capacity</label>
            <input type="number" required min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary-600 focus:ring-primary-500/20" />
            <label htmlFor="available" className="text-sm font-medium text-gray-700 dark:text-gray-300">Available for booking</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

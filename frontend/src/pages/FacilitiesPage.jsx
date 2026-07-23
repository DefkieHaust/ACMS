import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
        {isAdmin && (
          <Button onClick={openCreate}>Add Facility</Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchFacilities} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <Card key={f._id} hover>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{f.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Capacity: {f.capacity}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${f.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {f.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {f.description && <p className="text-sm text-gray-600 mb-4">{f.description}</p>}
            {isAdmin && (
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(f)} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Edit</button>
                <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
              </div>
            )}
          </Card>
        ))}
        {facilities.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">No facilities yet{isAdmin ? '. Click "Add Facility" to create one.' : ''}</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Facility' : 'Add Facility'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" required min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="rounded border-gray-300" />
            <label htmlFor="available" className="text-sm font-medium text-gray-700">Available for booking</label>
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

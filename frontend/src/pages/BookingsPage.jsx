import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function BookingsPage() {
  const { user } = useAuth();
  const isResident = user?.type === ROLES.RESIDENT;
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', purpose: '' });

  useEffect(() => {
    api.get('/facilities')
      .then((r) => setFacilities(r.data))
      .catch(() => {});
  }, []);

  const fetchBookings = (facilityId) => {
    setLoading(true);
    setError(null);
    if (!facilityId) { setBookings([]); setLoading(false); return; }
    api.get(`/facilities/${facilityId}/bookings`)
      .then((r) => setBookings(r.data))
      .catch((e) => { setError(e.response?.data?.error || 'Failed to load bookings'); })
      .finally(() => setLoading(false));
  };

  const handleFacilityChange = (e) => {
    setSelectedFacility(e.target.value);
    fetchBookings(e.target.value);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/facilities/${selectedFacility}/bookings`, form);
      toast.success('Booking confirmed');
      setModalOpen(false);
      setForm({ date: '', startTime: '', endTime: '', purpose: '' });
      fetchBookings(selectedFacility);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create booking');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/facilities/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      fetchBookings(selectedFacility);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  if (loading && selectedFacility) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facility Bookings</h1>
        <div className="flex gap-2">
          <select value={selectedFacility} onChange={handleFacilityChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select facility</option>
            {facilities.filter((f) => f.available).map((f) => (
              <option key={f._id} value={f._id}>{f.name} (Capacity: {f.capacity})</option>
            ))}
          </select>
          {selectedFacility && isResident && (
            <Button onClick={() => setModalOpen(true)}>Book Now</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => fetchBookings(selectedFacility)} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900 font-medium">{b.unitId?.unitNumber || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(b.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-600">{b.startTime} - {b.endTime}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{b.purpose || '-'}</td>
                <td className="px-6 py-4">
                  <Badge status={b.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  {b.status === 'confirmed' && (
                    <button onClick={() => handleCancel(b._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!selectedFacility && <p className="text-center text-gray-500 py-8">Select a facility to view its bookings</p>}
        {selectedFacility && bookings.length === 0 && <p className="text-center text-gray-500 py-8">No bookings found</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Facility">
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Confirm Booking</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

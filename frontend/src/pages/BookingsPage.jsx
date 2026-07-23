import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
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

  if (loading && selectedFacility) return (
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
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Facility Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Book and manage facility reservations</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedFacility} onChange={handleFacilityChange} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => fetchBookings(selectedFacility)} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFacility ? 'No bookings found' : 'Select a facility to view its bookings'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{b.unitId?.unitNumber || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{b.startTime} - {b.endTime}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{b.purpose || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge status={b.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleCancel(b._id)} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Cancel</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Facility">
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Purpose</label>
            <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
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

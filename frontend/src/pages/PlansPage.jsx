import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoading from '../components/PageLoading';
import toast from 'react-hot-toast';
import { CURRENCIES } from '../utils/constants';
import Button from '../components/Button';
import Card from '../components/Card';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', priceType: 'flat', price: '', features: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/admin/plans')
      .then((r) => setPlans(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load plans');
        toast.error('Failed to load plans');
      })
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', priceType: 'flat', price: '', features: '', currency: 'USD' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ name: p.name, priceType: p.priceType, price: String(p.price), features: (p.features || []).join(', '), currency: p.currency || 'USD' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: Number(form.price), features: form.features.split(',').map((f) => f.trim()).filter(Boolean) };
      if (editItem) {
        await api.put(`/admin/plans/${editItem._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('Plan created');
      }
      setModalOpen(false);
      const r = await api.get('/admin/plans');
      setPlans(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/plans/${confirmId}`);
      toast.success('Plan deleted');
      setPlans(plans.filter((p) => p._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete plan');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <Button onClick={openCreate}>+ New Plan</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p._id}>
            <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">{p.currency || '$'}{p.price}<span className="text-sm text-gray-500 font-normal">/{p.priceType === 'per-unit' ? 'unit/month' : 'month'}</span></p>
            <p className="text-sm text-gray-500 mt-1 capitalize">{p.priceType} pricing</p>
            {p.features?.length > 0 && (
              <ul className="mt-4 space-y-1">
                {p.features.map((f, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>)}
              </ul>
            )}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => openEdit(p)} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Edit</button>
              <button onClick={() => { setConfirmId(p._id); setConfirmOpen(true); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Plan" message="Delete this plan?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Plan' : 'New Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
            <select value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="flat">Flat monthly</option>
              <option value="per-unit">Per unit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
            <input type="text" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="e.g. Unlimited units, Priority support" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
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

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="h-5 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-3/4 mb-3" />
            <div className="h-8 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-1/2 mb-4" />
            <div className="h-4 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Plans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and pricing</p>
        </div>
        <Button onClick={openCreate}>+ New Plan</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No plans yet. Click "+ New Plan" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p._id}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{p.name}</h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">{p.currency || '$'}{p.price}<span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/{p.priceType === 'per-unit' ? 'unit/month' : 'month'}</span></p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">{p.priceType} pricing</p>
              {p.features?.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {p.features.map((f, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{f}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => openEdit(p)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
                <button onClick={() => { setConfirmId(p._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Plan" message="Delete this plan?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Plan' : 'New Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price Type</label>
            <select value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="flat">Flat monthly</option>
              <option value="per-unit">Per unit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price ($)</label>
            <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Features (comma separated)</label>
            <input type="text" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="e.g. Unlimited units, Priority support" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
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

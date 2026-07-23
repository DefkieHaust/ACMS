import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function InvoicesPage() {
  const { user } = useAuth();
  const isSiteAdmin = user?.type === 'site_admin';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const fetchInvoices = () => {
    setLoading(true);
    setError(null);
    const endpoint = isSiteAdmin ? '/admin/invoices' : '/apartment/invoices';
    api.get(endpoint)
      .then((r) => setInvoices(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load invoices');
        toast.error('Failed to load invoices');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, []);

  const markPaid = (inv) => {
    setPayingInvoice(inv);
    setPayModalOpen(true);
  };

  const handlePaySuccess = () => {
    fetchInvoices();
    setPayingInvoice(null);
  };

  const handleExport = async () => {
    try {
      const r = await api.get('/admin/invoices/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const generateInvoices = async () => {
    try {
      const r = await api.post('/admin/invoices/generate');
      toast.success(r.data.message);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to generate invoices');
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
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
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">SaaS Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription invoices and payments</p>
        </div>
        {isSiteAdmin && (
          <div className="flex gap-2">
            <Button onClick={generateInvoices}>Generate Monthly</Button>
            <Button onClick={handleExport} variant="primary" className="bg-green-600 hover:bg-green-700">Export CSV</Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchInvoices} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              {isSiteAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Apartment</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
              {isSiteAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={isSiteAdmin ? 7 : 6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  {isSiteAdmin && <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{inv.apartmentId?.name}</td>}
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{inv.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{inv.planId?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{(inv.currency || '$')}{inv.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge status={inv.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  {isSiteAdmin && (
                    <td className="px-6 py-4 text-sm text-right">
                      {inv.status === 'unpaid' && (
                        <button onClick={() => markPaid(inv)} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 transition-colors">Mark Paid</button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payingInvoice && (
        <PaymentModal
          open={payModalOpen}
          onClose={() => { setPayModalOpen(false); setPayingInvoice(null); }}
          amount={payingInvoice.amount}
          currency={payingInvoice.currency || 'USD'}
          invoiceId={payingInvoice._id}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}

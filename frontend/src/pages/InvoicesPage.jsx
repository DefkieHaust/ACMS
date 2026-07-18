import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const { user } = useAuth();
  const isSiteAdmin = user?.type === 'site_admin';
  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = () => {
    const endpoint = isSiteAdmin ? '/admin/invoices' : '/apartment/invoices';
    api.get(endpoint).then((r) => setInvoices(r.data));
  };

  useEffect(() => { fetchInvoices(); }, []);

  const markPaid = async (id) => {
    try {
      await api.put(`/admin/invoices/${id}/mark-paid`, { status: 'paid' });
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update invoice');
    }
  };

  const generateInvoices = async () => {
    try {
      const r = await api.get('/admin/invoices/generate');
      toast.success(r.data.message);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to generate invoices');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SaaS Invoices</h1>
        {isSiteAdmin && (
          <button onClick={generateInvoices} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Generate Monthly</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isSiteAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Apartment</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
              {isSiteAdmin && <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-gray-50">
                {isSiteAdmin && <td className="px-6 py-4 font-medium text-gray-900">{inv.apartmentId?.name}</td>}
                <td className="px-6 py-4 text-gray-600">{inv.period}</td>
                <td className="px-6 py-4 text-gray-600">{inv.planId?.name || '-'}</td>
                <td className="px-6 py-4 font-medium text-gray-900">${inv.amount?.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                {isSiteAdmin && (
                  <td className="px-6 py-4 text-right">
                    {inv.status === 'unpaid' && (
                      <button onClick={() => markPaid(inv._id)} className="text-sm text-green-600 hover:text-green-800 font-medium">Mark Paid</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-center text-gray-500 py-8">No invoices yet</p>}
      </div>
    </div>
  );
}

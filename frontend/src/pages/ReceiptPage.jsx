import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function ReceiptPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/resident')
      .then((r) => {
        const bills = r.data.bills || [];
        const found = bills.find((b) => b._id === billId);
        if (found) setBill(found);
        else { toast.error('Bill not found'); navigate('/bills'); }
      })
      .catch(() => { toast.error('Failed to load receipt'); navigate('/bills'); })
      .finally(() => setLoading(false));
  }, [billId]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!bill) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Payment Receipt</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receipt #{bill._id.slice(-8).toUpperCase()}</p>
          </div>

          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Period</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{bill.period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Committee</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{bill.committeeId?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Unit</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{bill.unitId?.unitNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Due Date</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(bill.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Paid On</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{bill.updatedAt ? new Date(bill.updatedAt).toLocaleString() : '-'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Paid</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">${bill.amount?.toFixed(2)}</span>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">Thank you for your payment.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This is a computer-generated receipt.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <Button onClick={() => window.print()} className="flex-1">Print Receipt</Button>
        <Button variant="secondary" onClick={() => navigate('/bills')} className="flex-1">Back to Bills</Button>
      </div>
    </div>
  );
}

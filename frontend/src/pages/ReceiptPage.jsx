import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

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

  if (loading) return <LoadingSkeleton lines={8} />;
  if (!bill) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
            <p className="text-sm text-gray-500 mt-1">Receipt #{bill._id.slice(-8).toUpperCase()}</p>
          </div>

          <div className="border-t border-b border-gray-200 py-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Period</span>
              <span className="text-sm font-medium text-gray-900">{bill.period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Committee</span>
              <span className="text-sm font-medium text-gray-900">{bill.committeeId?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Unit</span>
              <span className="text-sm font-medium text-gray-900">{bill.unitId?.unitNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Due Date</span>
              <span className="text-sm font-medium text-gray-900">{new Date(bill.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Paid On</span>
              <span className="text-sm font-medium text-gray-900">{bill.updatedAt ? new Date(bill.updatedAt).toLocaleString() : '-'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <span className="text-lg font-semibold text-gray-900">Total Paid</span>
            <span className="text-2xl font-bold text-green-600">${bill.amount?.toFixed(2)}</span>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">Thank you for your payment.</p>
            <p className="text-xs text-gray-400 mt-1">This is a computer-generated receipt.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 print:hidden">
        <button onClick={() => window.print()} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Print Receipt</button>
        <button onClick={() => navigate('/bills')} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Back to Bills</button>
      </div>
    </div>
  );
}

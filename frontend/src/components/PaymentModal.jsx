import { useState } from 'react';
import api from '../api/client';
import Modal from './Modal';
import toast from 'react-hot-toast';
import Button from './Button';

export default function PaymentModal({ open, onClose, amount, currency = 'USD', billId, invoiceId, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const intentRes = await api.post('/payments/create-intent', { amount, currency });
      const { paymentIntentId, simulated } = intentRes.data;

      if (simulated) {
        await api.post('/payments/confirm', { paymentIntentId });
      }

      if (billId) {
        await api.put(`/committees/bills/${billId}/pay`);
      }
      if (invoiceId) {
        await api.put(`/admin/invoices/${invoiceId}/mark-paid`, { status: 'paid' });
      }

      toast.success('Payment successful');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Payment">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Amount to pay:</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{currency === 'USD' ? '$' : currency}{amount?.toFixed(2)}</p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-700">Demo payment mode — no real charges will be made.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={handlePay} disabled={loading} className="flex-1">
            {loading ? 'Processing...' : `Pay ${currency === 'USD' ? '$' : currency}${amount?.toFixed(2)}`}
          </Button>
          <Button onClick={onClose} disabled={loading} variant="secondary" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

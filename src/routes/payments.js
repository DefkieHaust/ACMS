import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { createPaymentIntent, confirmPayment } from '../services/payment.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Valid amount is required' });
    const intent = await createPaymentIntent(amount, currency || 'USD', {
      apartmentId: req.apartmentId,
      userId: req.user.userId,
    });
    res.json({ success: true, data: {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      simulated: intent.simulated || false,
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ success: false, error: 'Payment intent ID is required' });
    const result = await confirmPayment(paymentIntentId);
    res.json({ success: true, data: { status: result.status, simulated: result.simulated || false } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to confirm payment' });
  }
});

export default router;

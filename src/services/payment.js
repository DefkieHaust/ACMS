import Stripe from 'stripe';

let stripeClient = null;

function getClient() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  const stripe = getClient();
  if (!stripe) {
    console.log('[PAYMENT] No Stripe key configured. Simulating payment for', amount, currency);
    return { id: 'simulated_' + Date.now(), amount, currency, status: 'succeeded', simulated: true };
  }
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
    });
    return intent;
  } catch (err) {
    console.error('[PAYMENT] Failed:', err.message);
    throw err;
  }
}

export async function confirmPayment(paymentIntentId) {
  const stripe = getClient();
  if (!stripe) {
    return { id: paymentIntentId, status: 'succeeded', simulated: true };
  }
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error('[PAYMENT] Confirm failed:', err.message);
    throw err;
  }
}

import cron from 'node-cron';
import { Apartment, Plan, SaaSInvoice } from './models/index.js';
import { Unit } from './models/index.js';

function getPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d;
}

export function startInvoiceCron() {
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Generating monthly SaaS invoices...');
    try {
      const apartments = await Apartment.find({ status: 'active', planId: { $ne: null } });
      const period = getPeriod();

      for (const apartment of apartments) {
        const existing = await SaaSInvoice.findOne({
          apartmentId: apartment._id,
          period,
        });
        if (existing) continue;

        const plan = await Plan.findById(apartment.planId);
        if (!plan) continue;

        let amount = plan.price;
        if (plan.priceType === 'per-unit') {
          const unitCount = await Unit.countDocuments({ apartmentId: apartment._id });
          amount = plan.price * unitCount;
        }

        await SaaSInvoice.create({
          apartmentId: apartment._id,
          planId: plan._id,
          period,
          amount,
          status: 'unpaid',
          dueDate: getDueDate(),
        });
        console.log(`  Invoice generated for apartment ${apartment.name}: $${amount}`);
      }
    } catch (err) {
      console.error('[Cron] Invoice generation failed:', err);
    }
  });
  console.log('Invoice cron scheduled (runs 1st of each month)');
}

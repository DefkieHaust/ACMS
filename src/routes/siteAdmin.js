import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createApartmentSchema,
  updateApartmentSchema,
  createPlanSchema,
  createUserSchema,
  markInvoicePaidSchema,
} from '../utils/validate.js';
import { hashPassword } from '../utils/helpers.js';
import { Apartment, Plan, User, SaaSInvoice } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, authorize(ROLES.SITE_ADMIN), tenantIsolation);

router.get('/apartments', async (req, res) => {
  try {
    const apartments = await Apartment.find().populate('planId').sort({ createdAt: -1 });
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch apartments' });
  }
});

router.post('/apartments', validate(createApartmentSchema), async (req, res) => {
  try {
    const existing = await Apartment.findOne({ name: req.validatedBody.name });
    if (existing) return res.status(409).json({ error: 'Apartment name already exists' });
    const apartment = await Apartment.create(req.validatedBody);
    res.status(201).json(apartment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create apartment' });
  }
});

router.put('/apartments/:id', validate(updateApartmentSchema), async (req, res) => {
  try {
    const updateData = { ...req.validatedBody };
    if (updateData.planId === '' || updateData.planId === null) updateData.planId = null;
    const apartment = await Apartment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!apartment) return res.status(404).json({ error: 'Apartment not found' });
    res.json(apartment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update apartment' });
  }
});

router.delete('/apartments/:id', async (req, res) => {
  try {
    await Apartment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Apartment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete apartment' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.post('/plans', validate(createPlanSchema), async (req, res) => {
  try {
    const plan = await Plan.create(req.validatedBody);
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/plans/:id', validate(createPlanSchema), async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

router.post('/apartment-admins', validate(createUserSchema), async (req, res) => {
  try {
    const { apartmentId, type, name, identifier, password } = req.validatedBody;
    if (type !== ROLES.APARTMENT_ADMIN) return res.status(400).json({ error: 'Type must be apartment_admin' });
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ error: 'Apartment not found' });

    const existing = await User.findOne({ apartmentId, type: ROLES.APARTMENT_ADMIN, identifier });
    if (existing) return res.status(409).json({ error: 'Admin with this identifier already exists in this apartment' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ apartmentId, type, name, identifier, passwordHash });
    res.status(201).json({ id: user._id, name: user.name, identifier: user.identifier, type: user.type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create apartment admin' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await SaaSInvoice.find()
      .populate('apartmentId', 'name')
      .populate('planId', 'name')
      .sort({ generatedAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.put('/invoices/:id/mark-paid', validate(markInvoicePaidSchema), async (req, res) => {
  try {
    const invoice = await SaaSInvoice.findByIdAndUpdate(
      req.params.id,
      { status: 'paid' },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.get('/invoices/generate', async (req, res) => {
  try {
    const apartments = await Apartment.find({ status: 'active', planId: { $ne: null } });
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    const results = [];

    for (const apartment of apartments) {
      const existing = await SaaSInvoice.findOne({ apartmentId: apartment._id, period });
      if (existing) {
        results.push({ apartment: apartment.name, skipped: true, reason: 'Already exists' });
        continue;
      }
      const plan = await Plan.findById(apartment.planId);
      if (!plan) continue;

      let amount = plan.price;
      if (plan.priceType === 'per-unit') {
        const { Unit } = await import('../models/index.js');
        const unitCount = await Unit.countDocuments({ apartmentId: apartment._id });
        amount = plan.price * unitCount;
      }

      await SaaSInvoice.create({ apartmentId: apartment._id, planId: plan._id, period, amount, status: 'unpaid', dueDate });
      results.push({ apartment: apartment.name, amount, generated: true });
    }

    res.json({ message: 'Invoices generated', results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoices' });
  }
});

export default router;

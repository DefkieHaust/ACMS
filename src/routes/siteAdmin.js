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
import { Apartment, Plan, User, SaaSInvoice, Unit } from '../models/index.js';
import { ROLES, COUNTRY_CURRENCY } from '../config/constants.js';
import { audit } from '../middleware/audit.js';

const router = Router();
router.use(authenticate, authorize(ROLES.SITE_ADMIN), tenantIsolation);

router.get('/apartments', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    const apartments = await Apartment.find(filter).populate('planId').sort({ createdAt: -1 });
    res.json({ success: true, data: apartments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch apartments' });
  }
});

router.post('/apartments', validate(createApartmentSchema), audit('create', 'apartment'), async (req, res) => {
  try {
    const data = { ...req.validatedBody };
    if (data.country && !data.defaultCurrency) {
      data.defaultCurrency = COUNTRY_CURRENCY[data.country.toLowerCase()] || 'USD';
    }
    const existing = await Apartment.findOne({ name: data.name });
    if (existing) return res.status(409).json({ success: false, error: 'Apartment name already exists' });
    const apartment = await Apartment.create(data);
    res.status(201).json({ success: true, data: apartment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create apartment' });
  }
});

router.put('/apartments/:id', validate(updateApartmentSchema), audit('update', 'apartment'), async (req, res) => {
  try {
    const updateData = { ...req.validatedBody };
    if (updateData.planId === '' || updateData.planId === null) updateData.planId = null;
    const apartment = await Apartment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!apartment) return res.status(404).json({ success: false, error: 'Apartment not found' });
    res.json({ success: true, data: apartment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update apartment' });
  }
});

router.delete('/apartments/:id', audit('delete', 'apartment'), async (req, res) => {
  try {
    await Apartment.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Apartment deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete apartment' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

router.post('/plans', validate(createPlanSchema), audit('create', 'plan'), async (req, res) => {
  try {
    const plan = await Plan.create(req.validatedBody);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

router.put('/plans/:id', validate(createPlanSchema), audit('update', 'plan'), async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

router.delete('/plans/:id', audit('delete', 'plan'), async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { message: 'Plan deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

router.post('/apartment-admins', validate(createUserSchema), audit('create', 'apartment_admin'), async (req, res) => {
  try {
    const { apartmentId, type, name, identifier, password, phone, identityNumber, residence } = req.validatedBody;
    if (type !== ROLES.APARTMENT_ADMIN) return res.status(400).json({ success: false, error: 'Type must be apartment_admin' });
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ success: false, error: 'Apartment not found' });

    const existing = await User.findOne({ apartmentId, type: ROLES.APARTMENT_ADMIN, identifier });
    if (existing) return res.status(409).json({ success: false, error: 'Admin with this identifier already exists in this apartment' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ apartmentId, type, name, identifier, passwordHash, phone, identityNumber, residence });
    res.status(201).json({ success: true, data: { id: user._id, name: user.name, identifier: user.identifier, type: user.type } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create apartment admin' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      const apartments = await Apartment.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      filter.apartmentId = { $in: apartments.map(a => a._id) };
    }
    const invoices = await SaaSInvoice.find(filter)
      .populate('apartmentId', 'name')
      .populate('planId', 'name')
      .sort({ generatedAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

router.put('/invoices/:id/mark-paid', validate(markInvoicePaidSchema), audit('update', 'invoice'), async (req, res) => {
  try {
    const invoice = await SaaSInvoice.findByIdAndUpdate(
      req.params.id,
      { status: 'paid' },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

router.get('/invoices/export', async (req, res) => {
  try {
    const invoices = await SaaSInvoice.find({})
      .populate('apartmentId', 'name')
      .populate('planId', 'name')
      .lean();

    const headers = ['apartment', 'period', 'plan', 'amount', 'currency', 'status', 'dueDate'];
    const rows = invoices.map(inv => ({
      apartment: inv.apartmentId?.name || '',
      period: inv.period,
      plan: inv.planId?.name || '',
      amount: inv.amount ?? '',
      currency: inv.currency || '',
      status: inv.status,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : '',
    }));

    const headerLine = headers.join(',');
    const dataLines = rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csv = [headerLine, ...dataLines].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

router.get('/invoices/generate', audit('create', 'invoice_generation'), async (req, res) => {
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
        const unitCount = await Unit.countDocuments({ apartmentId: apartment._id });
        amount = plan.price * unitCount;
      }

      const currency = apartment.defaultCurrency || plan.currency || 'USD';
      await SaaSInvoice.create({ apartmentId: apartment._id, planId: plan._id, period, amount, currency, status: 'unpaid', dueDate });
      results.push({ apartment: apartment.name, amount, currency, generated: true });
    }

    res.json({ success: true, data: { message: 'Invoices generated', results } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate invoices' });
  }
});

export default router;

router.get('/accounts', async (req, res) => {
  try {
    const users = await User.find({ type: { $ne: ROLES.SITE_ADMIN } })
      .select('-passwordHash')
      .populate('apartmentId', 'name')
      .sort({ type: 1, name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

router.post('/accounts', validate(createUserSchema), audit('create', 'account'), async (req, res) => {
  try {
    const { apartmentId, type, name, identifier, password, phone, identityNumber, residence } = req.validatedBody;
    if (!apartmentId) return res.status(400).json({ success: false, error: 'apartmentId is required' });
    if (!['apartment_admin', 'resident'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be apartment_admin or resident' });
    }
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ success: false, error: 'Apartment not found' });
    const existing = await User.findOne({ apartmentId, type, identifier });
    if (existing) return res.status(409).json({ success: false, error: 'Account with this identifier already exists' });
    const passwordHash = await hashPassword(password);
    const user = await User.create({ apartmentId, type, name, identifier, passwordHash, phone, identityNumber, residence });
    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, identifier: user.identifier, type: user.type } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
});

router.put('/accounts/:id', audit('update', 'account'), async (req, res) => {
  try {
    const allowed = ['type', 'apartmentId', 'status'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.apartmentId === '') update.apartmentId = null;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash').populate('apartmentId', 'name');
    if (!user) return res.status(404).json({ success: false, error: 'Account not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update account' });
  }
});

router.delete('/accounts/:id', audit('delete', 'account'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Account not found' });
    res.json({ success: true, data: { message: 'Account deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createUserSchema,
  createUnitSchema,
  createCommitteeSchema,
  createCommitteeHeadSchema,
} from '../utils/validate.js';
import { hashPassword } from '../utils/helpers.js';
import { User, Unit, Committee, SaaSInvoice } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, authorize(ROLES.APARTMENT_ADMIN, ROLES.SITE_ADMIN), tenantIsolation);

router.get('/units', async (req, res) => {
  try {
    const units = await Unit.find({ apartmentId: req.apartmentId })
      .populate('residentUserId', 'name identifier')
      .sort({ unitNumber: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

router.post('/units', validate(createUnitSchema), async (req, res) => {
  try {
    const unit = await Unit.create({ ...req.validatedBody, apartmentId: req.apartmentId });
    res.status(201).json(unit);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Unit number already exists' });
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

router.put('/units/:id', validate(createUnitSchema), async (req, res) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId },
      req.validatedBody,
      { new: true }
    );
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

router.delete('/units/:id', async (req, res) => {
  try {
    await Unit.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

router.get('/residents', async (req, res) => {
  try {
    const residents = await User.find({
      apartmentId: req.apartmentId,
      type: ROLES.RESIDENT,
    }).populate('unitId', 'unitNumber').sort({ name: 1 });
    res.json(residents.map((r) => ({
      _id: r._id,
      name: r.name,
      identifier: r.identifier,
      type: r.type,
      unitId: r.unitId,
      unitNumber: r.unitId?.unitNumber || null,
      status: r.status,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

router.post('/residents', validate(createUserSchema), async (req, res) => {
  try {
    const { type, name, identifier, password, unitId } = req.validatedBody;
    if (type !== ROLES.RESIDENT) return res.status(400).json({ error: 'Type must be resident' });

    const existing = await User.findOne({ apartmentId: req.apartmentId, type: ROLES.RESIDENT, identifier });
    if (existing) return res.status(409).json({ error: 'Resident with this identifier already exists' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      apartmentId: req.apartmentId,
      type: ROLES.RESIDENT,
      name,
      identifier,
      passwordHash,
      unitId: unitId || null,
    });

    if (unitId) {
      await Unit.findByIdAndUpdate(unitId, { residentUserId: user._id, status: 'occupied' });
    }

    res.status(201).json({ _id: user._id, name: user.name, identifier: user.identifier, type: user.type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resident' });
  }
});

router.put('/residents/:id', async (req, res) => {
  try {
    const { name, status, unitId } = req.body;
    const update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    if (unitId !== undefined) update.unitId = unitId || null;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId, type: ROLES.RESIDENT },
      update,
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Resident not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update resident' });
  }
});

router.delete('/residents/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      apartmentId: req.apartmentId,
      type: ROLES.RESIDENT,
    });
    if (user?.unitId) {
      await Unit.findByIdAndUpdate(user.unitId, { residentUserId: null, status: 'vacant' });
    }
    res.json({ message: 'Resident deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resident' });
  }
});

router.get('/committees', async (req, res) => {
  try {
    const committees = await Committee.find({ apartmentId: req.apartmentId })
      .populate('headUserId', 'name identifier')
      .sort({ name: 1 });
    res.json(committees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch committees' });
  }
});

router.post('/committees', validate(createCommitteeSchema), async (req, res) => {
  try {
    const committee = await Committee.create({ ...req.validatedBody, apartmentId: req.apartmentId });
    res.status(201).json(committee);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Committee name already exists' });
    res.status(500).json({ error: 'Failed to create committee' });
  }
});

router.put('/committees/:id', async (req, res) => {
  try {
    const { name, status } = req.body;
    const update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    const committee = await Committee.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId },
      update,
      { new: true }
    );
    if (!committee) return res.status(404).json({ error: 'Committee not found' });
    res.json(committee);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update committee' });
  }
});

router.delete('/committees/:id', async (req, res) => {
  try {
    await Committee.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    res.json({ message: 'Committee deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete committee' });
  }
});

router.post('/committees/:id/head', validate(createCommitteeHeadSchema), async (req, res) => {
  try {
    const committee = await Committee.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!committee) return res.status(404).json({ error: 'Committee not found' });

    const { name, identifier, password } = req.validatedBody;
    const existing = await User.findOne({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_HEAD,
      identifier,
    });
    if (existing) return res.status(409).json({ error: 'Committee head with this identifier already exists' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      name,
      identifier,
      passwordHash,
    });

    await Committee.findByIdAndUpdate(committee._id, { headUserId: user._id });

    res.status(201).json({ _id: user._id, name: user.name, identifier: user.identifier, type: user.type, committeeId: committee._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create committee head' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await SaaSInvoice.find({ apartmentId: req.apartmentId })
      .populate('planId', 'name')
      .sort({ generatedAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;

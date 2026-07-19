import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  createUnitSchema,
  createCommitteeSchema,
  createCommitteeHeadSchema,
} from '../utils/validate.js';
import { hashPassword } from '../utils/helpers.js';
import { User, Unit, Committee, SaaSInvoice, Apartment } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { audit } from '../middleware/audit.js';

const router = Router();
router.use(authenticate, authorize(ROLES.APARTMENT_ADMIN, ROLES.SITE_ADMIN), tenantIsolation);

router.get('/units', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { apartmentId: req.apartmentId };
    if (search) {
      filter.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { unitType: { $regex: search, $options: 'i' } },
      ];
    }
    const units = await Unit.find(filter)
      .populate('residentUserId', 'name identifier phone identityNumber residence')
      .populate('ownerId', 'name identifier phone identityNumber residence')
      .sort({ unitNumber: 1 });
    res.json({ success: true, data: units });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch units' });
  }
});

router.post('/units', validate(createUnitSchema), audit('create', 'unit'), async (req, res) => {
  try {
    const unit = await Unit.create({ ...req.validatedBody, apartmentId: req.apartmentId });
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Unit number already exists' });
    res.status(500).json({ success: false, error: 'Failed to create unit' });
  }
});

router.put('/units/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId },
      updateData,
      { new: true }
    );
    if (!unit) return res.status(404).json({ success: false, error: 'Unit not found' });
    res.json({ success: true, data: unit });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update unit' });
  }
});

router.delete('/units/:id', audit('delete', 'unit'), async (req, res) => {
  try {
    await Unit.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    res.json({ success: true, data: { message: 'Unit deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete unit' });
  }
});

router.get('/residents', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { apartmentId: req.apartmentId, type: ROLES.RESIDENT };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { identifier: { $regex: search, $options: 'i' } },
      ];
    }
    const residents = await User.find(filter).populate('unitId', 'unitNumber unitType').sort({ name: 1 });
    res.json({ success: true, data: residents.map((r) => ({
      _id: r._id,
      name: r.name,
      identifier: r.identifier,
      type: r.type,
      residentType: r.residentType,
      unitId: r.unitId,
      unitNumber: r.unitId?.unitNumber || null,
      phone: r.phone,
      identityNumber: r.identityNumber,
      residence: r.residence,
      status: r.status,
      createdAt: r.createdAt,
    })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch residents' });
  }
});

router.get('/unit-owners', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { type: ROLES.UNIT_OWNER };
    if (req.user.type !== ROLES.SITE_ADMIN) {
      filter.apartmentId = req.apartmentId;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { identifier: { $regex: search, $options: 'i' } },
      ];
    }
    const owners = await User.find(filter).sort({ name: 1 });
    res.json({ success: true, data: owners });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch unit owners' });
  }
});

router.post('/residents', validate(createUserSchema), audit('create', 'resident'), async (req, res) => {
  try {
    const { type, name, identifier, password, unitId, residentType, phone, identityNumber, residence } = req.validatedBody;
    if (type !== ROLES.RESIDENT) return res.status(400).json({ success: false, error: 'Type must be resident' });

    const existing = await User.findOne({ apartmentId: req.apartmentId, type: ROLES.RESIDENT, identifier });
    if (existing) return res.status(409).json({ success: false, error: 'Resident with this identifier already exists' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      apartmentId: req.apartmentId,
      type: ROLES.RESIDENT,
      residentType: residentType || null,
      name,
      identifier,
      passwordHash,
      unitId: unitId || null,
      phone: phone || [],
      identityNumber: identityNumber || '',
      residence: residence || '',
    });

    if (unitId) {
      await Unit.findByIdAndUpdate(unitId, { residentUserId: user._id, status: 'occupied' });
    }

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, identifier: user.identifier, type: user.type, residentType: user.residentType } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create resident' });
  }
});

router.put('/residents/:id', async (req, res) => {
  try {
    const { name, status, unitId, residentType, phone, identityNumber, residence } = req.body;
    const update = {};
    if (name) update.name = name;
    if (status) update.status = status;
    if (unitId !== undefined) update.unitId = unitId || null;
    if (residentType) update.residentType = residentType;
    if (phone) update.phone = phone;
    if (identityNumber !== undefined) update.identityNumber = identityNumber;
    if (residence !== undefined) update.residence = residence;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId, type: ROLES.RESIDENT },
      update,
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'Resident not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update resident' });
  }
});

router.delete('/residents/:id', audit('delete', 'resident'), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      apartmentId: req.apartmentId,
      type: ROLES.RESIDENT,
    });
    if (user?.unitId) {
      await Unit.findByIdAndUpdate(user.unitId, { residentUserId: null, status: 'vacant' });
    }
    res.json({ success: true, data: { message: 'Resident deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete resident' });
  }
});

router.get('/committees', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { apartmentId: req.apartmentId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    const committees = await Committee.find(filter)
      .populate('headUserId', 'name identifier')
      .sort({ name: 1 });
    res.json({ success: true, data: committees });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch committees' });
  }
});

router.post('/committees', validate(createCommitteeSchema), audit('create', 'committee'), async (req, res) => {
  try {
    const committee = await Committee.create({ ...req.validatedBody, apartmentId: req.apartmentId });
    res.status(201).json({ success: true, data: committee });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Committee name already exists' });
    res.status(500).json({ success: false, error: 'Failed to create committee' });
  }
});

router.put('/committees/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (status) update.status = status;
    const committee = await Committee.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId },
      update,
      { new: true }
    );
    if (!committee) return res.status(404).json({ success: false, error: 'Committee not found' });
    res.json({ success: true, data: committee });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update committee' });
  }
});

router.delete('/committees/:id', audit('delete', 'committee'), async (req, res) => {
  try {
    await Committee.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    res.json({ success: true, data: { message: 'Committee deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete committee' });
  }
});

router.post('/committees/:id/head', validate(createCommitteeHeadSchema), audit('create', 'committee_head'), async (req, res) => {
  try {
    const committee = await Committee.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!committee) return res.status(404).json({ success: false, error: 'Committee not found' });

    const { name, identifier, password, phone, identityNumber, residence } = req.validatedBody;
    const existing = await User.findOne({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_HEAD,
      identifier,
    });
    if (existing) return res.status(409).json({ success: false, error: 'Committee head with this identifier already exists' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      name,
      identifier,
      passwordHash,
      phone: phone || [],
      identityNumber: identityNumber || '',
      residence: residence || '',
    });

    await Committee.findByIdAndUpdate(committee._id, { headUserId: user._id });

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, identifier: user.identifier, type: user.type, committeeId: committee._id } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create committee head' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await SaaSInvoice.find({ apartmentId: req.apartmentId })
      .populate('planId', 'name')
      .sort({ generatedAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.apartmentId).populate('planId');
    if (!apartment) return res.status(404).json({ success: false, error: 'Apartment not found' });
    res.json({ success: true, data: apartment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { defaultCurrency, city, country, address, apartmentType } = req.body;
    const update = {};
    if (defaultCurrency) update.defaultCurrency = defaultCurrency;
    if (city !== undefined) update.city = city;
    if (country !== undefined) update.country = country;
    if (address !== undefined) update.address = address;
    if (apartmentType !== undefined) update.apartmentType = apartmentType;
    const apartment = await Apartment.findByIdAndUpdate(req.apartmentId, update, { new: true });
    res.json({ success: true, data: apartment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

export default router;

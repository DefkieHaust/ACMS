import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCommitteeMemberSchema,
  addCommitteeMemberFromExistingSchema,
  ledgerEntrySchema,
  generateBillsSchema,
  createCustomRoleSchema,
} from '../utils/validate.js';
import { hashPassword, getPagination } from '../utils/helpers.js';
import { User, Committee, CommitteeLedger, MaintenanceBill, Unit } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { audit } from '../middleware/audit.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.COMMITTEE_HEAD || req.user.type === ROLES.COMMITTEE_MEMBER) {
      filter._id = req.user.committeeId;
    }
    const { page, limit, skip } = getPagination(req.query);
    const [committees, total] = await Promise.all([
      Committee.find(filter)
        .populate('headUserId', 'name identifier')
        .sort({ name: 1 })
        .skip(skip).limit(limit),
      Committee.countDocuments(filter)
    ]);
    res.json({ success: true, data: committees, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch committees' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const committee = await Committee.findOne({
      _id: req.params.id,
      apartmentId: req.apartmentId,
    }).populate('headUserId', 'name identifier');
    if (!committee) return res.status(404).json({ success: false, error: 'Committee not found' });
    res.json({ success: true, data: committee });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch committee' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const filter = { apartmentId: req.apartmentId, committeeId: req.params.id, type: { $in: [ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER] } };
    const { page, limit, skip } = getPagination(req.query);
    const [members, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ type: 1, name: 1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: members, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
});

router.get('/:id/available-users', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const existingMemberIds = await User.find({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
    }).select('_id');

    const available = await User.find({
      apartmentId: req.apartmentId,
      _id: { $nin: existingMemberIds.map(m => m._id) },
      type: { $in: [ROLES.RESIDENT] },
    }).select('name identifier type residentType').sort({ name: 1 });

    res.json({ success: true, data: available });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch available users' });
  }
});

router.get('/:id/roles', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { CustomRole } = await import('../models/index.js');
    const roles = await CustomRole.find({ committeeId: req.params.id }).sort({ name: 1 });
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
});

router.post('/:id/roles', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), validate(createCustomRoleSchema), audit('create', 'custom_role'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { CustomRole } = await import('../models/index.js');
    const role = await CustomRole.create({
      committeeId: req.params.id,
      name: req.validatedBody.name,
      createdBy: req.user.userId,
    });
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Role name already exists' });
    res.status(500).json({ success: false, error: 'Failed to create role' });
  }
});

router.delete('/:id/roles/:roleId', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), audit('delete', 'custom_role'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.roleId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { CustomRole } = await import('../models/index.js');
    await CustomRole.findOneAndDelete({ _id: req.params.roleId, committeeId: req.params.id });
    res.json({ success: true, data: { message: 'Role deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete role' });
  }
});

router.post('/:id/members', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const committee = await Committee.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!committee) return res.status(404).json({ success: false, error: 'Committee not found' });

    const { userId, name, identifier, password, phone, identityNumber, residence, customRole } = req.body;

    let user;
    if (userId) {
      user = await User.findOne({ _id: userId, apartmentId: req.apartmentId });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      if (user.committeeId) return res.status(409).json({ success: false, error: 'User is already in a committee' });
      user.type = ROLES.COMMITTEE_MEMBER;
      user.committeeId = committee._id;
      if (customRole) user.customRole = customRole;
      await user.save();
    } else {
      if (!name || !identifier || !password) {
        return res.status(400).json({ success: false, error: 'name, identifier, and password are required for new members' });
      }
      const existing = await User.findOne({
        apartmentId: req.apartmentId,
        type: ROLES.COMMITTEE_MEMBER,
        identifier,
      });
      if (existing) return res.status(409).json({ success: false, error: 'Member with this identifier already exists' });

      const passwordHash = await hashPassword(password);
      user = await User.create({
        apartmentId: req.apartmentId,
        type: ROLES.COMMITTEE_MEMBER,
        committeeId: committee._id,
        name,
        identifier,
        passwordHash,
        phone: phone || [],
        identityNumber: identityNumber || '',
        residence: residence || '',
        customRole: customRole || '',
      });
    }

    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, identifier: user.identifier, type: user.type, customRole: user.customRole } });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ success: false, error: 'Failed to add committee member' });
  }
});

router.put('/:committeeId/members/:memberId', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.committeeId) || !mongoose.Types.ObjectId.isValid(req.params.memberId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { role } = req.body;
    if (role && ['committee_member', 'committee_head'].includes(role)) {
      await User.findByIdAndUpdate(req.params.memberId, { type: role });
    }
    res.json({ success: true, data: { message: 'Role updated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update member role' });
  }
});

router.put('/:committeeId/members/:memberId/role', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.committeeId) || !mongoose.Types.ObjectId.isValid(req.params.memberId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { customRole } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.memberId, committeeId: req.params.committeeId },
      { customRole: customRole || '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'Member not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update member role' });
  }
});

router.delete('/:committeeId/members/:memberId', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), audit('delete', 'committee_member'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.committeeId) || !mongoose.Types.ObjectId.isValid(req.params.memberId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    await User.findOneAndDelete({
      _id: req.params.memberId,
      apartmentId: req.apartmentId,
      committeeId: req.params.committeeId,
    });
    res.json({ success: true, data: { message: 'Member removed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

router.get('/:id/ledger', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const filter = { apartmentId: req.apartmentId, committeeId: req.params.id };
    const { page, limit, skip } = getPagination(req.query);
    const [entries, total] = await Promise.all([
      CommitteeLedger.find(filter).populate('recordedBy', 'name').sort({ date: -1 }).skip(skip).limit(limit),
      CommitteeLedger.countDocuments(filter)
    ]);
    res.json({ success: true, data: entries, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
});

router.post('/:id/ledger', authorize(ROLES.COMMITTEE_HEAD), validate(ledgerEntrySchema), audit('create', 'ledger_entry'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const entry = await CommitteeLedger.create({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
      ...req.validatedBody,
      recordedBy: req.user.userId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create ledger entry' });
  }
});

router.get('/:id/bills', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const filter = { apartmentId: req.apartmentId, committeeId: req.params.id };
    const { page, limit, skip } = getPagination(req.query);
    const [bills, total] = await Promise.all([
      MaintenanceBill.find(filter).populate('unitId', 'unitNumber').sort({ dueDate: -1 }).skip(skip).limit(limit),
      MaintenanceBill.countDocuments(filter)
    ]);
    res.json({ success: true, data: bills, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bills' });
  }
});

router.post('/:id/bills/generate', authorize(ROLES.COMMITTEE_HEAD), validate(generateBillsSchema), audit('create', 'bills'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { amount, period, dueDate, currency } = req.validatedBody;
    const units = await Unit.find({ apartmentId: req.apartmentId, status: 'occupied' });
    const bills = await MaintenanceBill.insertMany(
      units.map((unit) => ({
        apartmentId: req.apartmentId,
        committeeId: req.params.id,
        unitId: unit._id,
        amount,
        currency: currency || 'USD',
        period,
        dueDate: new Date(dueDate),
      }))
    );
    res.status(201).json({ success: true, data: { message: `Generated ${bills.length} bills`, count: bills.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate bills' });
  }
});

router.put('/bills/:billId/pay', authorize(ROLES.RESIDENT), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.billId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const unit = await Unit.findOne({ residentUserId: req.user.userId });
    if (!unit) return res.status(404).json({ success: false, error: 'Unit not found' });

    const bill = await MaintenanceBill.findOneAndUpdate(
      { _id: req.params.billId, unitId: unit._id, status: 'unpaid' },
      { status: 'paid' },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, error: 'Bill not found or already paid' });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to pay bill' });
  }
});

export default router;

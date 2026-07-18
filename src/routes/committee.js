import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCommitteeMemberSchema,
  ledgerEntrySchema,
  generateBillsSchema,
} from '../utils/validate.js';
import { hashPassword } from '../utils/helpers.js';
import { User, Committee, CommitteeLedger, MaintenanceBill, Unit } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.COMMITTEE_HEAD || req.user.type === ROLES.COMMITTEE_MEMBER) {
      filter._id = req.user.committeeId;
    }
    const committees = await Committee.find(filter)
      .populate('headUserId', 'name identifier')
      .sort({ name: 1 });
    res.json(committees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch committees' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const committee = await Committee.findOne({
      _id: req.params.id,
      apartmentId: req.apartmentId,
    }).populate('headUserId', 'name identifier');
    if (!committee) return res.status(404).json({ error: 'Committee not found' });
    res.json(committee);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch committee' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const members = await User.find({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
      type: { $in: [ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER] },
    }).select('-passwordHash').sort({ type: 1, name: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/:id/members', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), validate(createCommitteeMemberSchema), async (req, res) => {
  try {
    const committee = await Committee.findOne({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!committee) return res.status(404).json({ error: 'Committee not found' });

    const { name, identifier, password } = req.validatedBody;
    const existing = await User.findOne({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_MEMBER,
      identifier,
    });
    if (existing) return res.status(409).json({ error: 'Member with this identifier already exists' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      apartmentId: req.apartmentId,
      type: ROLES.COMMITTEE_MEMBER,
      committeeId: committee._id,
      name,
      identifier,
      passwordHash,
    });

    res.status(201).json({ _id: user._id, name: user.name, identifier: user.identifier, type: user.type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create committee member' });
  }
});

router.delete('/:committeeId/members/:memberId', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    await User.findOneAndDelete({
      _id: req.params.memberId,
      apartmentId: req.apartmentId,
      committeeId: req.params.committeeId,
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.get('/:id/ledger', authorize(ROLES.COMMITTEE_HEAD, ROLES.APARTMENT_ADMIN), async (req, res) => {
  try {
    const entries = await CommitteeLedger.find({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
    }).populate('recordedBy', 'name').sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

router.post('/:id/ledger', authorize(ROLES.COMMITTEE_HEAD), validate(ledgerEntrySchema), async (req, res) => {
  try {
    const entry = await CommitteeLedger.create({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
      ...req.validatedBody,
      recordedBy: req.user.userId,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ledger entry' });
  }
});

router.get('/:id/bills', async (req, res) => {
  try {
    const bills = await MaintenanceBill.find({
      apartmentId: req.apartmentId,
      committeeId: req.params.id,
    }).populate('unitId', 'unitNumber').sort({ dueDate: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/:id/bills/generate', authorize(ROLES.COMMITTEE_HEAD), validate(generateBillsSchema), async (req, res) => {
  try {
    const { amount, period, dueDate } = req.validatedBody;
    const units = await Unit.find({ apartmentId: req.apartmentId, status: 'occupied' });
    const bills = await MaintenanceBill.insertMany(
      units.map((unit) => ({
        apartmentId: req.apartmentId,
        committeeId: req.params.id,
        unitId: unit._id,
        amount,
        period,
        dueDate: new Date(dueDate),
      }))
    );
    res.status(201).json({ message: `Generated ${bills.length} bills`, count: bills.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate bills' });
  }
});

router.put('/bills/:billId/pay', authorize(ROLES.RESIDENT), async (req, res) => {
  try {
    const unit = await Unit.findOne({ residentUserId: req.user.userId });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const bill = await MaintenanceBill.findOneAndUpdate(
      { _id: req.params.billId, unitId: unit._id, status: 'unpaid' },
      { status: 'paid' },
      { new: true }
    );
    if (!bill) return res.status(404).json({ error: 'Bill not found or already paid' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: 'Failed to pay bill' });
  }
});

export default router;

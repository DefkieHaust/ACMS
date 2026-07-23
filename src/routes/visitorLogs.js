import crypto from 'crypto';
import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { audit } from '../middleware/audit.js';
import { createVisitorLogSchema, checkoutVisitorSchema } from '../utils/validate.js';
import { VisitorLog } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { getPagination } from '../utils/helpers.js';
import { notifyApartmentAdmins } from '../services/notify.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.query.status === 'pre_approved') filter.preApproved = true;
    if (req.query.status === 'checked_in') filter.checkOut = null;
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { visitorName: { $regex: escaped, $options: 'i' } },
        { unitVisited: { $regex: escaped, $options: 'i' } },
      ];
    }
    const { page, limit, skip } = getPagination(req.query);
    const [logs, total] = await Promise.all([
      VisitorLog.find(filter)
        .populate('loggedBy', 'name')
        .populate('preApprovedBy', 'name')
        .sort({ checkIn: -1 })
        .skip(skip).limit(limit),
      VisitorLog.countDocuments(filter)
    ]);
    res.json({ success: true, data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch visitor logs' });
  }
});

router.post('/', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), validate(createVisitorLogSchema), audit('create', 'visitor_log'), async (req, res) => {
  try {
    const log = await VisitorLog.create({
      apartmentId: req.apartmentId,
      ...req.validatedBody,
      loggedBy: req.user.userId,
    });
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create visitor log' });
  }
});

router.post('/pre-approve', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), audit('create', 'visitor_pre_approve'), async (req, res) => {
  try {
    const { visitorName, purpose, unitVisited, phone } = req.body;
    if (!visitorName || !unitVisited) return res.status(400).json({ success: false, error: 'Visitor name and unit are required' });
    const qrCode = crypto.randomBytes(16).toString('hex');
    const log = await VisitorLog.create({
      apartmentId: req.apartmentId,
      visitorName, purpose: purpose || 'Pre-approved visit',
      unitVisited, phone: phone || '',
      loggedBy: req.user.userId,
      preApproved: true,
      qrCode,
      preApprovedBy: req.user.userId,
    });
    await notifyApartmentAdmins(req.apartmentId, `Pre-approved visitor: ${visitorName} for ${unitVisited}`, `/visitors`);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to pre-approve visitor' });
  }
});

router.get('/verify/:qrCode', async (req, res) => {
  try {
    const log = await VisitorLog.findOne({ qrCode: req.params.qrCode, apartmentId: req.apartmentId })
      .populate('preApprovedBy', 'name');
    if (!log) return res.status(404).json({ success: false, error: 'Invalid QR code' });
    if (log.checkIn && log.checkOut) return res.json({ success: true, data: { ...log.toObject(), status: 'completed' } });
    if (log.checkIn) return res.json({ success: true, data: { ...log.toObject(), status: 'checked_in' } });
    log.checkIn = new Date();
    await log.save();
    res.json({ success: true, data: { ...log.toObject(), status: 'checked_in' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to verify QR code' });
  }
});

router.put('/:id/checkout', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), audit('update', 'visitor_checkout'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const log = await VisitorLog.findOneAndUpdate(
        { qrCode: req.params.id, apartmentId: req.apartmentId, checkOut: null },
        { checkOut: new Date() },
        { new: true }
      );
      if (!log) return res.status(404).json({ success: false, error: 'Visitor not found or already checked out' });
      return res.json({ success: true, data: log });
    }
    const log = await VisitorLog.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId, checkOut: null },
      { checkOut: new Date() },
      { new: true }
    );
    if (!log) return res.status(404).json({ success: false, error: 'Visitor log not found or already checked out' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to checkout visitor' });
  }
});

export default router;

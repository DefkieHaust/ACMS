import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createVisitorLogSchema } from '../utils/validate.js';
import { VisitorLog } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { getPagination } from '../utils/helpers.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.COMMITTEE_MEMBER || req.user.type === ROLES.COMMITTEE_HEAD) {
      filter.loggedBy = req.user.userId;
    }
    const { page, limit, skip } = getPagination(req.query);
    const [logs, total] = await Promise.all([
      VisitorLog.find(filter)
        .populate('loggedBy', 'name')
        .sort({ checkIn: -1 })
        .skip(skip).limit(limit),
      VisitorLog.countDocuments(filter)
    ]);
    res.json({ success: true, data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch visitor logs' });
  }
});

router.post('/', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), validate(createVisitorLogSchema), async (req, res) => {
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

router.put('/:id/checkout', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), async (req, res) => {
  try {
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

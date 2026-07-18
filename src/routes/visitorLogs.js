import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createVisitorLogSchema, checkoutVisitorSchema } from '../utils/validate.js';
import { VisitorLog } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.COMMITTEE_MEMBER || req.user.type === ROLES.COMMITTEE_HEAD) {
      filter.loggedBy = req.user.userId;
    }
    const logs = await VisitorLog.find(filter)
      .populate('loggedBy', 'name')
      .sort({ checkIn: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitor logs' });
  }
});

router.post('/', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), validate(createVisitorLogSchema), async (req, res) => {
  try {
    const log = await VisitorLog.create({
      apartmentId: req.apartmentId,
      ...req.validatedBody,
      loggedBy: req.user.userId,
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create visitor log' });
  }
});

router.put('/:id/checkout', authorize(ROLES.COMMITTEE_MEMBER, ROLES.COMMITTEE_HEAD), async (req, res) => {
  try {
    const log = await VisitorLog.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId, checkOut: null },
      { checkOut: new Date() },
      { new: true }
    );
    if (!log) return res.status(404).json({ error: 'Visitor log not found or already checked out' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to checkout visitor' });
  }
});

export default router;

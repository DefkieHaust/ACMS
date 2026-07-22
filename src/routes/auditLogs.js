import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { getPagination, escapeRegex } from '../utils/helpers.js';
import { AuditLog } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', authorize(ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const filter = {};
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.search) {
      const escaped = escapeRegex(req.query.search);
      filter['details.path'] = { $regex: escaped, $options: 'i' };
    }
    const { page, limit, skip } = getPagination(req.query);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name identifier type')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter)
    ]);
    res.json({ success: true, data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

router.get('/resources', authorize(ROLES.SITE_ADMIN), async (req, res) => {
  try {
    const resources = await AuditLog.distinct('resource');
    const actions = await AuditLog.distinct('action');
    res.json({ success: true, data: { resources, actions } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit metadata' });
  }
});

export default router;

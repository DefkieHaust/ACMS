import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoticeSchema } from '../utils/validate.js';
import { Notice } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { getPagination } from '../utils/helpers.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };

    if (req.user.type === ROLES.COMMITTEE_HEAD || req.user.type === ROLES.COMMITTEE_MEMBER) {
      filter = {
        apartmentId: req.apartmentId,
        $or: [
          { committeeId: req.user.committeeId },
          { committeeId: null },
        ],
      };
    }

    const { page, limit, skip } = getPagination(req.query);
    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate('postedBy', 'name')
        .populate('committeeId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Notice.countDocuments(filter)
    ]);
    res.json({ success: true, data: notices, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch notices' });
  }
});

router.post('/', validate(createNoticeSchema), async (req, res) => {
  try {
    if (req.user.type === ROLES.RESIDENT) {
      return res.status(403).json({ success: false, error: 'Residents cannot post notices' });
    }
    if (req.user.type === ROLES.COMMITTEE_MEMBER) {
      return res.status(403).json({ success: false, error: 'Committee members cannot post notices' });
    }

    const noticeData = {
      apartmentId: req.apartmentId,
      ...req.validatedBody,
      postedBy: req.user.userId,
    };

    if (req.user.type === ROLES.COMMITTEE_HEAD) {
      noticeData.committeeId = req.user.committeeId;
    }

    const notice = await Notice.create(noticeData);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create notice' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const notice = await Notice.findOneAndDelete({
      _id: req.params.id,
      apartmentId: req.apartmentId,
      postedBy: req.user.userId,
    });
    if (!notice) return res.status(404).json({ success: false, error: 'Notice not found or unauthorized' });
    res.json({ success: true, data: { message: 'Notice deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete notice' });
  }
});

export default router;

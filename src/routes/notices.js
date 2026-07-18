import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoticeSchema } from '../utils/validate.js';
import { Notice } from '../models/index.js';
import { ROLES } from '../config/constants.js';

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

    const notices = await Notice.find(filter)
      .populate('postedBy', 'name')
      .populate('committeeId', 'name')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

router.post('/', validate(createNoticeSchema), async (req, res) => {
  try {
    if (req.user.type === ROLES.RESIDENT) {
      return res.status(403).json({ error: 'Residents cannot post notices' });
    }
    if (req.user.type === ROLES.COMMITTEE_MEMBER) {
      return res.status(403).json({ error: 'Committee members cannot post notices' });
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
    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const notice = await Notice.findOneAndDelete({
      _id: req.params.id,
      apartmentId: req.apartmentId,
      postedBy: req.user.userId,
    });
    if (!notice) return res.status(404).json({ error: 'Notice not found or unauthorized' });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

export default router;

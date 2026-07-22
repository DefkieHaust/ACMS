import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createComplaintSchema, updateComplaintSchema } from '../utils/validate.js';
import { Complaint, Unit, Committee } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.RESIDENT) {
      const unit = await Unit.findOne({ residentUserId: req.user.userId });
      if (unit) filter.raisedByUnitId = unit._id;
      else return res.json({ success: true, data: [] });
    } else if (req.user.type === ROLES.COMMITTEE_HEAD || req.user.type === ROLES.COMMITTEE_MEMBER) {
      filter.committeeId = req.user.committeeId;
    }

    const complaints = await Complaint.find(filter)
      .populate('raisedByUnitId', 'unitNumber')
      .populate('committeeId', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
});

router.post('/', validate(createComplaintSchema), async (req, res) => {
  try {
    if (req.user.type !== ROLES.RESIDENT) {
      return res.status(403).json({ success: false, error: 'Only residents can raise complaints' });
    }
    const unit = await Unit.findOne({ residentUserId: req.user.userId, apartmentId: req.apartmentId });
    if (!unit) return res.status(400).json({ success: false, error: 'No unit associated with your account' });

    const committee = await Committee.findOne({ _id: req.validatedBody.committeeId, apartmentId: req.apartmentId });
    if (!committee) return res.status(404).json({ success: false, error: 'Committee not found' });

    const complaint = await Complaint.create({
      apartmentId: req.apartmentId,
      committeeId: req.validatedBody.committeeId,
      raisedByUnitId: unit._id,
      title: req.validatedBody.title || '',
      description: req.validatedBody.description,
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create complaint' });
  }
});

router.put('/:id', validate(updateComplaintSchema), async (req, res) => {
  try {
    let filter = { _id: req.params.id, apartmentId: req.apartmentId };
    if (req.user.type === ROLES.COMMITTEE_HEAD || req.user.type === ROLES.COMMITTEE_MEMBER) {
      filter.committeeId = req.user.committeeId;
    }
    const update = {};
    if (req.validatedBody.status) update.status = req.validatedBody.status;
    if (req.validatedBody.assignedTo) update.assignedTo = req.validatedBody.assignedTo;
    if (req.validatedBody.status === 'resolved') update.resolvedAt = new Date();
    if (req.validatedBody.rating) update.rating = req.validatedBody.rating;

    const complaint = await Complaint.findOneAndUpdate(filter, update, { new: true });
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update complaint' });
  }
});

router.put('/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }
    const unit = await Unit.findOne({ residentUserId: req.user.userId });
    if (!unit) return res.status(403).json({ success: false, error: 'Only the resident who raised the complaint can rate' });

    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, raisedByUnitId: unit._id, status: 'resolved' },
      { rating },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, error: 'Complaint not found or not yet resolved' });
    res.json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to rate complaint' });
  }
});

export default router;

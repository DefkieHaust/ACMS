import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, tenantIsolation, authorize } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';
import { getPagination } from '../utils/helpers.js';
import { ServiceRequest, Unit, User } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { notifyApartmentAdmins, notifyResident } from '../services/notify.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    let filter = { apartmentId: req.apartmentId };
    if (req.user.type === ROLES.RESIDENT) {
      const unit = await Unit.findOne({ residentUserId: req.user.userId });
      if (unit) filter.unitId = unit._id;
      else return res.json({ success: true, data: [] });
    }
    if (req.query.status) filter.status = req.query.status;
    const { page, limit, skip } = getPagination(req.query);
    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('unitId', 'unitNumber')
        .populate('residentUserId', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      ServiceRequest.countDocuments(filter)
    ]);
    res.json({ success: true, data: requests, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch service requests' });
  }
});

router.post('/', authorize(ROLES.RESIDENT), audit('create', 'service_request'), async (req, res) => {
  try {
    const unit = await Unit.findOne({ residentUserId: req.user.userId, apartmentId: req.apartmentId });
    if (!unit) return res.status(400).json({ success: false, error: 'No unit associated with your account' });
    const { title, description, category, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
    const request = await ServiceRequest.create({
      apartmentId: req.apartmentId, unitId: unit._id, residentUserId: req.user.userId,
      title, description: description || '', category: category || 'other', priority: priority || 'medium',
    });
    await notifyApartmentAdmins(req.apartmentId, `New service request: ${title}`, '/service-requests');
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create service request' });
  }
});

router.put('/:id', authorize(ROLES.APARTMENT_ADMIN), audit('update', 'service_request'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { status, assignedTo, notes } = req.body;
    const update = { updatedAt: new Date() };
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (notes !== undefined) update.notes = notes;
    const request = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, apartmentId: req.apartmentId }, update, { new: true }
    );
    if (!request) return res.status(404).json({ success: false, error: 'Service request not found' });
    if (request.residentUserId) {
      await notifyResident(req.apartmentId, request.residentUserId, `Service request updated: ${update.status || ''}`, '/service-requests');
    }
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update service request' });
  }
});

router.put('/:id/rate', authorize(ROLES.RESIDENT), audit('update', 'service_request_rating'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    const unit = await Unit.findOne({ residentUserId: req.user.userId });
    const request = await ServiceRequest.findOneAndUpdate(
      { _id: req.params.id, unitId: unit?._id, status: 'completed' },
      { rating, updatedAt: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, error: 'Service request not found or not yet completed' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to rate service request' });
  }
});

export default router;

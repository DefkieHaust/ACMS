import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, tenantIsolation, authorize } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';
import { validate } from '../middleware/validate.js';
import { getPagination } from '../utils/helpers.js';
import { Facility, FacilityBooking, Unit, User } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { notifyApartmentAdmins, notifyResident } from '../services/notify.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    const filter = { apartmentId: req.apartmentId };
    const { page, limit, skip } = getPagination(req.query);
    const [facilities, total] = await Promise.all([
      Facility.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Facility.countDocuments(filter)
    ]);
    res.json({ success: true, data: facilities, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch facilities' });
  }
});

router.post('/', authorize(ROLES.APARTMENT_ADMIN), audit('create', 'facility'), async (req, res) => {
  try {
    const { name, description, capacity, available } = req.body;
    if (!name || !capacity) return res.status(400).json({ success: false, error: 'Name and capacity are required' });
    const facility = await Facility.create({ apartmentId: req.apartmentId, name, description, capacity, available });
    res.status(201).json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create facility' });
  }
});

router.put('/:id', authorize(ROLES.APARTMENT_ADMIN), audit('update', 'facility'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const { name, description, capacity, available } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (capacity !== undefined) update.capacity = capacity;
    if (available !== undefined) update.available = available;
    const facility = await Facility.findOneAndUpdate({ _id: req.params.id, apartmentId: req.apartmentId }, update, { new: true });
    if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
    res.json({ success: true, data: facility });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update facility' });
  }
});

router.delete('/:id', authorize(ROLES.APARTMENT_ADMIN), audit('delete', 'facility'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const facility = await Facility.findOneAndDelete({ _id: req.params.id, apartmentId: req.apartmentId });
    if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
    await FacilityBooking.deleteMany({ facilityId: req.params.id });
    res.json({ success: true, data: { message: 'Facility deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete facility' });
  }
});

router.get('/:facilityId/bookings', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.facilityId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const filter = { apartmentId: req.apartmentId, facilityId: req.params.facilityId };
    const { page, limit, skip } = getPagination(req.query);
    const [bookings, total] = await Promise.all([
      FacilityBooking.find(filter).populate('unitId', 'unitNumber').sort({ date: -1 }).skip(skip).limit(limit),
      FacilityBooking.countDocuments(filter)
    ]);
    res.json({ success: true, data: bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

router.post('/:facilityId/bookings', authorize(ROLES.RESIDENT), audit('create', 'facility_booking'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.facilityId)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const facility = await Facility.findOne({ _id: req.params.facilityId, apartmentId: req.apartmentId });
    if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
    if (!facility.available) return res.status(400).json({ success: false, error: 'Facility is not available for booking' });

    const unit = await Unit.findOne({ residentUserId: req.user.userId, apartmentId: req.apartmentId });
    if (!unit) return res.status(400).json({ success: false, error: 'No unit associated with your account' });

    const { date, startTime, endTime, purpose } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ success: false, error: 'Date, start time, and end time are required' });

    const conflict = await FacilityBooking.findOne({
      facilityId: req.params.facilityId, date: new Date(date), status: 'confirmed',
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ]
    });
    if (conflict) return res.status(409).json({ success: false, error: 'Time slot conflicts with an existing booking' });

    const booking = await FacilityBooking.create({
      apartmentId: req.apartmentId, facilityId: req.params.facilityId,
      unitId: unit._id, date: new Date(date), startTime, endTime, purpose,
    });
    await notifyApartmentAdmins(req.apartmentId, `New facility booking: ${facility.name} on ${date}`, '/bookings');
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

router.put('/bookings/:id/cancel', authorize(ROLES.APARTMENT_ADMIN, ROLES.RESIDENT), audit('update', 'cancel_booking'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    let filter = { _id: req.params.id, apartmentId: req.apartmentId, status: 'confirmed' };
    if (req.user.type === ROLES.RESIDENT) {
      const unit = await Unit.findOne({ residentUserId: req.user.userId });
      if (unit) filter.unitId = unit._id;
    }
    const booking = await FacilityBooking.findOneAndUpdate(filter, { status: 'cancelled' }, { new: true });
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or already cancelled' });
    if (booking.unitId) {
      const unit = await Unit.findById(booking.unitId);
      if (unit?.residentUserId) {
        await notifyResident(req.apartmentId, unit.residentUserId, 'Your facility booking was cancelled', '/bookings');
      }
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

export default router;

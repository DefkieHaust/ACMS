import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { getPagination } from '../utils/helpers.js';
import { Notification } from '../models/index.js';

const router = Router();
router.use(authenticate, tenantIsolation);

router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user.userId, apartmentId: req.apartmentId };
    if (req.query.unreadOnly === 'true') filter.read = false;
    const { page, limit, skip } = getPagination(req.query);
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter)
    ]);
    res.json({ success: true, data: notifications, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.userId, read: false });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;

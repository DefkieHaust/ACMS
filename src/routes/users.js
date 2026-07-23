import mongoose from 'mongoose';
import { Router } from 'express';
import { authenticate, tenantIsolation } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, adminChangePasswordSchema } from '../utils/validate.js';
import { hashPassword, escapeRegex, getPagination } from '../utils/helpers.js';
import { User } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { audit } from '../middleware/audit.js';

const router = Router();
router.use(authenticate, tenantIsolation);

const HIERARCHY = {
  [ROLES.SITE_ADMIN]: [ROLES.APARTMENT_ADMIN, ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER, ROLES.RESIDENT, ROLES.UNIT_OWNER],
  [ROLES.APARTMENT_ADMIN]: [ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER, ROLES.RESIDENT, ROLES.UNIT_OWNER],
  [ROLES.COMMITTEE_HEAD]: [ROLES.COMMITTEE_MEMBER],
};

function canManage(managerType, targetType) {
  const allowed = HIERARCHY[managerType];
  return allowed && allowed.includes(targetType);
}

router.get('/', async (req, res) => {
  try {
    let filter = {};
    const managerType = req.user.type;

    if (managerType === ROLES.SITE_ADMIN) {
      filter = {};
    } else if (managerType === ROLES.APARTMENT_ADMIN) {
      filter = { apartmentId: req.apartmentId };
    } else if (managerType === ROLES.COMMITTEE_HEAD) {
      filter = { apartmentId: req.apartmentId, committeeId: req.user.committeeId };
    } else {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const { search } = req.query;
    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { identifier: { $regex: escaped, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = getPagination(req.query);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('unitId', 'unitNumber')
      .sort({ type: 1, name: 1 })
      .skip(skip).limit(limit);

    const filtered = users.filter(u => u.type !== ROLES.SITE_ADMIN && canManage(managerType, u.type));
    res.json({ success: true, data: filtered, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const user = await User.findById(req.params.id).select('-passwordHash').populate('unitId', 'unitNumber');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (!canManage(req.user.type, user.type)) {
      return res.status(403).json({ success: false, error: 'Cannot manage this user' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

router.put('/:id', validate(updateUserSchema), audit('update', 'user'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (!canManage(req.user.type, target.type)) {
      return res.status(403).json({ success: false, error: 'Cannot manage this user' });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true }).select('-passwordHash');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

router.put('/:id/change-password', validate(adminChangePasswordSchema), audit('update', 'user_password'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID format' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (!canManage(req.user.type, target.type)) {
      return res.status(403).json({ success: false, error: 'Cannot manage this user' });
    }

    const { newPassword } = req.validatedBody;
    target.passwordHash = await hashPassword(newPassword);
    await target.save();
    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;

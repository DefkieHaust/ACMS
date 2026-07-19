import { Router } from 'express';
import { comparePassword, generateToken, hashPassword } from '../utils/helpers.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '../utils/validate.js';
import { User, Apartment } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/apartments', async (req, res) => {
  try {
    const apartments = await Apartment.find({ status: 'active' }).select('name address city country apartmentType');
    res.json({ success: true, data: apartments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch apartments' });
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { apartmentName, type, identifier, password } = req.validatedBody;

    let user;
    if (type === 'site_admin') {
      user = await User.findOne({ type: 'site_admin', identifier }).populate('unitId');
      if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    } else {
      if (!apartmentName) return res.status(400).json({ success: false, error: 'Apartment name required' });
      const apartment = await Apartment.findOne({ name: apartmentName.toLowerCase() });
      if (!apartment) return res.status(401).json({ success: false, error: 'Apartment not found' });
      if (apartment.status === 'suspended') return res.status(403).json({ success: false, error: 'Apartment is suspended' });

      user = await User.findOne({
        apartmentId: apartment._id,
        type,
        identifier,
      }).populate('unitId committeeId');

      if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Account is inactive' });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const tokenPayload = {
      userId: user._id,
      type: user.type,
      apartmentId: user.apartmentId,
      committeeId: user.committeeId,
      unitId: user.unitId,
    };

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          type: user.type,
          residentType: user.residentType,
          apartmentId: user.apartmentId,
          committeeId: user.committeeId,
          unitId: user.unitId,
          unitNumber: user.unitId?.unitNumber || null,
          phone: user.phone,
          identityNumber: user.identityNumber,
          residence: user.residence,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const valid = await comparePassword(req.validatedBody.currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

    user.passwordHash = await hashPassword(req.validatedBody.newPassword);
    await user.save();

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;

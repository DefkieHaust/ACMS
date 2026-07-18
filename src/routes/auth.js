import { Router } from 'express';
import { comparePassword, generateToken } from '../utils/helpers.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../utils/validate.js';
import { User, Apartment } from '../models/index.js';

const router = Router();

router.get('/apartments', async (req, res) => {
  try {
    const apartments = await Apartment.find({ status: 'active' }).select('name address');
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch apartments' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { apartmentName, type, identifier, password } = req.validatedBody;

    let user;
    if (type === 'site_admin') {
      user = await User.findOne({ type: 'site_admin', identifier }).populate('unitId');
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    } else {
      if (!apartmentName) return res.status(400).json({ error: 'Apartment name required' });
      const apartment = await Apartment.findOne({ name: apartmentName.toLowerCase() });
      if (!apartment) return res.status(401).json({ error: 'Apartment not found' });
      if (apartment.status === 'suspended') return res.status(403).json({ error: 'Apartment is suspended' });

      user = await User.findOne({
        apartmentId: apartment._id,
        type,
        identifier,
      }).populate('unitId committeeId');

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      req.apartmentId = apartment._id;
    }

    if (user.status !== 'active') return res.status(403).json({ error: 'Account is inactive' });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload = {
      userId: user._id,
      type: user.type,
      apartmentId: user.apartmentId,
      committeeId: user.committeeId,
      unitId: user.unitId,
    };

    const token = generateToken(tokenPayload);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        type: user.type,
        apartmentId: user.apartmentId,
        committeeId: user.committeeId,
        unitId: user.unitId,
        unitNumber: user.unitId?.unitNumber || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;

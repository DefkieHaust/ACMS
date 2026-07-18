import { verifyToken } from '../utils/helpers.js';
import { ROLES } from '../config/constants.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.type)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function tenantIsolation(req, res, next) {
  if (req.user.type === ROLES.SITE_ADMIN) {
    req.apartmentId = null;
    return next();
  }
  if (!req.user.apartmentId) {
    return res.status(403).json({ error: 'Tenant context required' });
  }
  req.apartmentId = req.user.apartmentId;
  next();
}

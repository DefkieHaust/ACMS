import { AuditLog } from '../models/index.js';

export function audit(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const resourceId = req.params?.id || body?._id || null;
      AuditLog.create({
        userId: req.user?.userId,
        action,
        resource,
        resourceId,
        details: {
          method: req.method,
          path: req.originalUrl,
          body: sanitizeBody(req.body),
          statusCode: res.statusCode,
        },
      }).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}

function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  return sanitized;
}

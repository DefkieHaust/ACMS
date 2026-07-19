import { authenticate, authorize, tenantIsolation } from '../../src/middleware/auth.js';
import { generateToken } from '../../src/utils/helpers.js';
import { ROLES } from '../../src/config/constants.js';

function mockReqRes(overrides = {}) {
  let statusCode, jsonData;
  const req = { headers: {}, user: null, ...overrides };
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { jsonData = data; return this; },
    _getStatus() { return statusCode; },
    _getJson() { return jsonData; },
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  next._called = () => nextCalled;
  return { req, res, next };
}

describe('authenticate', () => {
  it('calls next with valid token', () => {
    const token = generateToken({ userId: 'abc', type: 'site_admin' });
    const { req, res, next } = mockReqRes({ headers: { authorization: `Bearer ${token}` } });
    authenticate(req, res, next);
    expect(next._called()).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.type).toBe('site_admin');
  });

  it('returns 401 if no auth header', () => {
    const { req, res, next } = mockReqRes();
    authenticate(req, res, next);
    expect(res._getStatus()).toBe(401);
    expect(res._getJson()).toEqual({ success: false, error: 'Authentication required' });
    expect(next._called()).toBe(false);
  });

  it('returns 401 if token is invalid', () => {
    const { req, res, next } = mockReqRes({ headers: { authorization: 'Bearer invalid-token' } });
    authenticate(req, res, next);
    expect(res._getStatus()).toBe(401);
    expect(res._getJson()).toEqual({ success: false, error: 'Invalid or expired token' });
    expect(next._called()).toBe(false);
  });
});

describe('authorize', () => {
  it('allows user with matching role', () => {
    const { req, res, next } = mockReqRes({ user: { type: ROLES.SITE_ADMIN } });
    const middleware = authorize(ROLES.SITE_ADMIN);
    middleware(req, res, next);
    expect(next._called()).toBe(true);
  });

  it('denies user without matching role', () => {
    const { req, res, next } = mockReqRes({ user: { type: ROLES.RESIDENT } });
    const middleware = authorize(ROLES.SITE_ADMIN);
    middleware(req, res, next);
    expect(res._getStatus()).toBe(403);
    expect(next._called()).toBe(false);
  });

  it('allows user with one of multiple allowed roles', () => {
    const { req, res, next } = mockReqRes({ user: { type: ROLES.APARTMENT_ADMIN } });
    const middleware = authorize(ROLES.SITE_ADMIN, ROLES.APARTMENT_ADMIN);
    middleware(req, res, next);
    expect(next._called()).toBe(true);
  });

  it('denies if no user on request', () => {
    const { req, res, next } = mockReqRes();
    const middleware = authorize(ROLES.SITE_ADMIN);
    middleware(req, res, next);
    expect(res._getStatus()).toBe(403);
  });
});

describe('tenantIsolation', () => {
  it('sets apartmentId to null for site_admin', () => {
    const { req, res, next } = mockReqRes({ user: { type: ROLES.SITE_ADMIN } });
    tenantIsolation(req, res, next);
    expect(req.apartmentId).toBeNull();
    expect(next._called()).toBe(true);
  });

  it('sets apartmentId from user for non-site_admin', () => {
    const aptId = '507f1f77bcf86cd799439011';
    const { req, res, next } = mockReqRes({ user: { type: ROLES.APARTMENT_ADMIN, apartmentId: aptId } });
    tenantIsolation(req, res, next);
    expect(req.apartmentId).toBe(aptId);
    expect(next._called()).toBe(true);
  });

  it('returns 403 if non-site_admin has no apartmentId', () => {
    const { req, res, next } = mockReqRes({ user: { type: ROLES.RESIDENT, apartmentId: undefined } });
    tenantIsolation(req, res, next);
    expect(res._getStatus()).toBe(403);
    expect(next._called()).toBe(false);
  });
});

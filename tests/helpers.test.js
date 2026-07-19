import { hashPassword, comparePassword, generateToken, verifyToken, getPagination } from '../src/utils/helpers.js';
import { config } from '../src/config/index.js';
import jwt from 'jsonwebtoken';

describe('hashPassword / comparePassword', () => {
  it('hashes a password and returns a string', async () => {
    const hashed = await hashPassword('test-password');
    expect(typeof hashed).toBe('string');
    expect(hashed).not.toBe('test-password');
  });

  it('returns true for matching password', async () => {
    const hashed = await hashPassword('test-password');
    const match = await comparePassword('test-password', hashed);
    expect(match).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hashed = await hashPassword('test-password');
    const match = await comparePassword('wrong-password', hashed);
    expect(match).toBe(false);
  });
});

describe('generateToken / verifyToken', () => {
  it('generates a JWT token', () => {
    const payload = { userId: 'abc123', type: 'site_admin' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, config.jwtSecret);
    expect(decoded.userId).toBe('abc123');
    expect(decoded.type).toBe('site_admin');
  });

  it('verifyToken decodes a valid token', () => {
    const payload = { userId: 'abc123', type: 'site_admin' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('abc123');
    expect(decoded.type).toBe('site_admin');
  });

  it('verifyToken throws for an invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('verifyToken throws for expired token', () => {
    const token = jwt.sign({ userId: 'abc' }, config.jwtSecret, { expiresIn: '0s' });
    expect(() => verifyToken(token)).toThrow();
  });
});

describe('getPagination', () => {
  it('returns default page and limit', () => {
    const result = getPagination({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses page and limit from query', () => {
    const result = getPagination({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps limit to max 100', () => {
    const result = getPagination({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('ensures minimum page of 1', () => {
    const result = getPagination({ page: '0' });
    expect(result.page).toBe(1);
  });
});

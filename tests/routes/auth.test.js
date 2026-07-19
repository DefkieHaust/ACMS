import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/auth.js';
import { createTestApartment, createTestUser } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('GET /api/auth/apartments', () => {
  beforeEach(async () => {
    await clearDB();
  });

  it('returns active apartments', async () => {
    await createTestApartment({ name: 'apt-a', address: 'Addr A' });
    await createTestApartment({ name: 'apt-b', address: 'Addr B', status: 'suspended' });

    const res = await request(app).get('/api/auth/apartments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('apt-a');
  });

  it('returns empty array when no active apartments', async () => {
    const res = await request(app).get('/api/auth/apartments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await clearDB();
  });

  it('logs in site_admin with valid credentials', async () => {
    await createTestUser({ identifier: 'site-admin-1', password: 'admin123', type: ROLES.SITE_ADMIN });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ type: 'site_admin', identifier: 'site-admin-1', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.type).toBe('site_admin');
  });

  it('rejects site_admin with wrong password', async () => {
    await createTestUser({ identifier: 'site-admin-2', password: 'admin123', type: ROLES.SITE_ADMIN });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ type: 'site_admin', identifier: 'site-admin-2', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('logs in a resident with valid credentials', async () => {
    const apartment = await createTestApartment({ name: 'res-apt' });
    await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'resident-1',
      password: 'secret123',
      name: 'Jane Doe',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ apartmentName: 'res-apt', type: 'resident', identifier: 'resident-1', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.type).toBe('resident');
  });

  it('rejects login for suspended apartment', async () => {
    const apt = await createTestApartment({ name: 'susp-apt', status: 'suspended' });
    await createTestUser({
      apartmentId: apt._id,
      type: ROLES.RESIDENT,
      identifier: 'resident-2',
      password: 'secret123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ apartmentName: 'susp-apt', type: 'resident', identifier: 'resident-2', password: 'secret123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Apartment is suspended');
  });

  it('rejects inactive account', async () => {
    const apartment = await createTestApartment({ name: 'inact-apt' });
    await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'inactive-user',
      password: 'secret123',
      status: 'inactive',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ apartmentName: 'inact-apt', type: 'resident', identifier: 'inactive-user', password: 'secret123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Account is inactive');
  });

  it('returns 400 when apartmentName missing for non-site_admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ type: 'resident', identifier: 'any-user', password: 'secret123' });

    expect(res.status).toBe(400);
  });
});

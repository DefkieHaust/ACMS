import request from 'supertest';
import express from 'express';
import siteAdminRouter from '../../src/routes/siteAdmin.js';
import { createTestApartment, createTestPlan, createTestUser, createTestSaaSInvoice, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/admin', siteAdminRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Site Admin - Apartments CRUD', () => {
  let admin;

  beforeAll(async () => {
    await clearDB();
    admin = await createTestUser({ type: ROLES.SITE_ADMIN });
  });

  it('GET /api/admin/apartments - returns empty list', async () => {
    const res = await request(app).get('/api/admin/apartments').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/admin/apartments - creates an apartment', async () => {
    const res = await request(app)
      .post('/api/admin/apartments')
      .set(authHeader(admin))
      .send({ name: 'New Apt', address: '456 Main St' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('new apt');
    expect(res.body.data.address).toBe('456 Main St');
  });

  it('POST /api/admin/apartments - rejects duplicate name', async () => {
    await request(app)
      .post('/api/admin/apartments')
      .set(authHeader(admin))
      .send({ name: 'dup-apt', address: 'Addr' });

    const res = await request(app)
      .post('/api/admin/apartments')
      .set(authHeader(admin))
      .send({ name: 'dup-apt', address: 'Addr 2' });

    expect(res.status).toBe(409);
  });

  it('PUT /api/admin/apartments/:id - updates an apartment', async () => {
    const apt = await createTestApartment();
    const res = await request(app)
      .put(`/api/admin/apartments/${apt._id}`)
      .set(authHeader(admin))
      .send({ address: 'New Address' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.address).toBe('New Address');
  });

  it('PUT /api/admin/apartments/:id - returns 404 for unknown id', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .put(`/api/admin/apartments/${fakeId}`)
      .set(authHeader(admin))
      .send({ address: 'New Addr' });

    expect(res.status).toBe(404);
  });

  it('DELETE /api/admin/apartments/:id - deletes an apartment', async () => {
    const apt = await createTestApartment();
    const res = await request(app).delete(`/api/admin/apartments/${apt._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
  });
});

describe('Site Admin - Plans CRUD', () => {
  let admin;

  beforeAll(async () => {
    await clearDB();
    admin = await createTestUser({ type: ROLES.SITE_ADMIN });
  });

  it('GET /api/admin/plans - returns empty list', async () => {
    const res = await request(app).get('/api/admin/plans').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/admin/plans - creates a plan', async () => {
    const res = await request(app)
      .post('/api/admin/plans')
      .set(authHeader(admin))
      .send({ name: 'Gold', priceType: 'flat', price: 199 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Gold');
  });

  it('PUT /api/admin/plans/:id - updates a plan', async () => {
    const plan = await createTestPlan();
    const res = await request(app)
      .put(`/api/admin/plans/${plan._id}`)
      .set(authHeader(admin))
      .send({ name: 'Gold Plus', priceType: 'flat', price: 299 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Gold Plus');
  });

  it('DELETE /api/admin/plans/:id - deletes a plan', async () => {
    const plan = await createTestPlan();
    const res = await request(app).delete(`/api/admin/plans/${plan._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
  });
});

describe('Site Admin - Apartment Admins', () => {
  let admin, apartment;

  beforeAll(async () => {
    await clearDB();
    admin = await createTestUser({ type: ROLES.SITE_ADMIN });
    apartment = await createTestApartment();
  });

  it('POST /api/admin/apartment-admins - creates an apartment admin', async () => {
    const res = await request(app)
      .post('/api/admin/apartment-admins')
      .set(authHeader(admin))
      .send({
        apartmentId: apartment._id.toString(),
        type: 'apartment_admin',
        name: 'Apt Admin',
        identifier: 'aptadmin1',
        password: 'secret123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('apartment_admin');
  });

  it('POST /api/admin/apartment-admins - rejects non-apartment_admin type', async () => {
    const res = await request(app)
      .post('/api/admin/apartment-admins')
      .set(authHeader(admin))
      .send({
        apartmentId: apartment._id.toString(),
        type: 'resident',
        name: 'Res',
        identifier: 'res1',
        password: 'secret123',
      });

    expect(res.status).toBe(400);
  });
});

describe('Site Admin - Invoices', () => {
  let admin;

  beforeAll(async () => {
    await clearDB();
    admin = await createTestUser({ type: ROLES.SITE_ADMIN });
  });

  it('GET /api/admin/invoices - returns empty list', async () => {
    const res = await request(app).get('/api/admin/invoices').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('GET /api/admin/invoices - returns invoices', async () => {
    const apt = await createTestApartment();
    const plan = await createTestPlan();
    await createTestSaaSInvoice({ apartmentId: apt._id, planId: plan._id });

    const res = await request(app).get('/api/admin/invoices').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('PUT /api/admin/invoices/:id/mark-paid - marks invoice paid', async () => {
    const apt = await createTestApartment();
    const plan = await createTestPlan();
    const inv = await createTestSaaSInvoice({ apartmentId: apt._id, planId: plan._id });

    const res = await request(app)
      .put(`/api/admin/invoices/${inv._id}/mark-paid`)
      .set(authHeader(admin))
      .send({ status: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('paid');
  });

  it('GET /api/admin/invoices/generate - generates invoices for active apartments with plans', async () => {
    const plan = await createTestPlan();
    await createTestApartment({ planId: plan._id });

    const res = await request(app).get('/api/admin/invoices/generate').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Invoices generated');
  });
});

describe('Site Admin - Authorization', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/apartments');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-site_admin role', async () => {
    const user = await createTestUser({ type: ROLES.RESIDENT });
    const res = await request(app).get('/api/admin/apartments').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});

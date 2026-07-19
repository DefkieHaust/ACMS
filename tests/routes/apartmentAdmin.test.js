import request from 'supertest';
import express from 'express';
import apartmentAdminRouter from '../../src/routes/apartmentAdmin.js';
import { createTestApartment, createTestPlan, createTestUser, createTestUnit, createTestCommittee, createTestSaaSInvoice, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/apartment', apartmentAdminRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Apartment Admin - Units', () => {
  let admin, apartment;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ type: ROLES.APARTMENT_ADMIN, apartmentId: apartment._id });
  });

  it('GET /api/apartment/units - returns empty list', async () => {
    const res = await request(app).get('/api/apartment/units').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/apartment/units - creates a unit', async () => {
    const res = await request(app)
      .post('/api/apartment/units')
      .set(authHeader(admin))
      .send({ unitNumber: '101' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unitNumber).toBe('101');
  });

  it('POST /api/apartment/units - rejects duplicate unit number', async () => {
    await request(app)
      .post('/api/apartment/units')
      .set(authHeader(admin))
      .send({ unitNumber: '102' });

    const res = await request(app)
      .post('/api/apartment/units')
      .set(authHeader(admin))
      .send({ unitNumber: '102' });

    expect(res.status).toBe(409);
  });

  it('PUT /api/apartment/units/:id - updates a unit', async () => {
    const unit = await createTestUnit({ apartmentId: apartment._id });
    const res = await request(app)
      .put(`/api/apartment/units/${unit._id}`)
      .set(authHeader(admin))
      .send({ unitNumber: '101A', status: 'occupied' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unitNumber).toBe('101A');
  });

  it('DELETE /api/apartment/units/:id - deletes a unit', async () => {
    const unit = await createTestUnit({ apartmentId: apartment._id });
    const res = await request(app).delete(`/api/apartment/units/${unit._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
  });
});

describe('Apartment Admin - Residents', () => {
  let admin, apartment, unit;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ type: ROLES.APARTMENT_ADMIN, apartmentId: apartment._id });
    unit = await createTestUnit({ apartmentId: apartment._id });
  });

  it('GET /api/apartment/residents - returns empty list', async () => {
    const res = await request(app).get('/api/apartment/residents').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/apartment/residents - creates a resident', async () => {
    const res = await request(app)
      .post('/api/apartment/residents')
      .set(authHeader(admin))
      .send({
        type: 'resident',
        name: 'John Doe',
        identifier: 'john001',
        password: 'secret123',
        unitId: unit._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('resident');
  });

  it('POST /api/apartment/residents - rejects non-resident type', async () => {
    const res = await request(app)
      .post('/api/apartment/residents')
      .set(authHeader(admin))
      .send({
        type: 'apartment_admin',
        name: 'Bad',
        identifier: 'bad001',
        password: 'secret123',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/apartment/residents - rejects duplicate identifier', async () => {
    await request(app)
      .post('/api/apartment/residents')
      .set(authHeader(admin))
      .send({ type: 'resident', name: 'Jane', identifier: 'dup001', password: 'secret123' });

    const res = await request(app)
      .post('/api/apartment/residents')
      .set(authHeader(admin))
      .send({ type: 'resident', name: 'Jane 2', identifier: 'dup001', password: 'secret123' });

    expect(res.status).toBe(409);
  });

  it('PUT /api/apartment/residents/:id - updates a resident', async () => {
    const resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'upd001',
      password: 'secret123',
    });

    const res = await request(app)
      .put(`/api/apartment/residents/${resident._id}`)
      .set(authHeader(admin))
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('DELETE /api/apartment/residents/:id - deletes a resident', async () => {
    const resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'del001',
      password: 'secret123',
    });

    const res = await request(app).delete(`/api/apartment/residents/${resident._id}`).set(authHeader(admin));
    expect(res.status).toBe(200);
  });
});

describe('Apartment Admin - Committees', () => {
  let admin, apartment;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ type: ROLES.APARTMENT_ADMIN, apartmentId: apartment._id });
  });

  it('GET /api/apartment/committees - returns empty list', async () => {
    const res = await request(app).get('/api/apartment/committees').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('POST /api/apartment/committees - creates a committee', async () => {
    const res = await request(app)
      .post('/api/apartment/committees')
      .set(authHeader(admin))
      .send({ name: 'Finance Committee' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Finance Committee');
  });

  it('POST /api/apartment/committees - rejects duplicate name', async () => {
    await request(app)
      .post('/api/apartment/committees')
      .set(authHeader(admin))
      .send({ name: 'Unique Committee' });

    const res = await request(app)
      .post('/api/apartment/committees')
      .set(authHeader(admin))
      .send({ name: 'Unique Committee' });

    expect(res.status).toBe(409);
  });

  it('POST /api/apartment/committees/:id/head - creates committee head', async () => {
    const committee = await createTestCommittee({ apartmentId: apartment._id });

    const res = await request(app)
      .post(`/api/apartment/committees/${committee._id}/head`)
      .set(authHeader(admin))
      .send({ name: 'Committee Head', identifier: 'head001', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('committee_head');
    expect(res.body.data.committeeId).toBe(committee._id.toString());
  });
});

describe('Apartment Admin - Invoices', () => {
  let admin, apartment;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ type: ROLES.APARTMENT_ADMIN, apartmentId: apartment._id });
  });

  it('GET /api/apartment/invoices - returns invoices for the apartment', async () => {
    const plan = await createTestPlan();
    await createTestSaaSInvoice({ apartmentId: apartment._id, planId: plan._id });

    const res = await request(app).get('/api/apartment/invoices').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

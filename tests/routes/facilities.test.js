import request from 'supertest';
import express from 'express';
import facilitiesRouter from '../../src/routes/facilities.js';
import { createTestApartment, createTestUser, createTestUnit, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';
import { Facility } from '../../src/models/index.js';

beforeAll(async () => { await startDB(); await clearDB(); }, 30000);

const app = express();
app.use(express.json());
app.use('/api/facilities', facilitiesRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Facilities Routes', () => {
  let apartment, admin, resident, facility;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ apartmentId: apartment._id, type: ROLES.APARTMENT_ADMIN, identifier: 'fac-admin' });
    resident = await createTestUser({ apartmentId: apartment._id, type: ROLES.RESIDENT, identifier: 'fac-res' });
    await createTestUnit({ apartmentId: apartment._id, residentUserId: resident._id, status: 'occupied' });
    facility = await Facility.create({ apartmentId: apartment._id, name: 'Pool', capacity: 20, available: true });
  });

  describe('GET /', () => {
    it('lists facilities', async () => {
      const res = await request(app).get('/api/facilities').set(authHeader(resident));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('POST /', () => {
    it('apartment admin can create facility', async () => {
      const res = await request(app).post('/api/facilities').set(authHeader(admin)).send({ name: 'Gym', capacity: 30 });
      expect(res.status).toBe(201);
    });

    it('resident cannot create facility', async () => {
      const res = await request(app).post('/api/facilities').set(authHeader(resident)).send({ name: 'Gym', capacity: 30 });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /:id', () => {
    it('apartment admin can delete facility', async () => {
      const f = await Facility.create({ apartmentId: apartment._id, name: 'Temp', capacity: 5 });
      const res = await request(app).delete(`/api/facilities/${f._id}`).set(authHeader(admin));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /:facilityId/bookings', () => {
    it('returns bookings for a facility', async () => {
      const res = await request(app).get(`/api/facilities/${facility._id}/bookings`).set(authHeader(resident));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

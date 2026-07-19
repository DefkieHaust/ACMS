import request from 'supertest';
import express from 'express';
import complaintsRouter from '../../src/routes/complaints.js';
import { createTestApartment, createTestUser, createTestCommittee, createTestUnit, createTestComplaint, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/complaints', complaintsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Complaints Routes', () => {
  let apartment, committee, unit, resident, head;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    unit = await createTestUnit({ apartmentId: apartment._id, status: 'occupied' });
    resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'comp-res',
      password: 'secret123',
      unitId: unit._id,
    });
    head = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      identifier: 'comp-head',
      password: 'secret123',
    });
    await unit.constructor.findByIdAndUpdate(unit._id, { residentUserId: resident._id });
  });

  describe('GET /', () => {
    it('returns complaints for resident', async () => {
      await createTestComplaint({ apartmentId: apartment._id, committeeId: committee._id, raisedByUnitId: unit._id });

      const res = await request(app).get('/api/complaints').set(authHeader(resident));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('returns complaints for committee head', async () => {
      const res = await request(app).get('/api/complaints').set(authHeader(head));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /', () => {
    it('resident can raise a complaint', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set(authHeader(resident))
        .send({ committeeId: committee._id.toString(), description: 'Broken elevator' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Broken elevator');
    });

    it('non-resident cannot raise a complaint', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set(authHeader(head))
        .send({ committeeId: committee._id.toString(), description: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /:id', () => {
    it('committee head can update complaint status', async () => {
      const complaint = await createTestComplaint({ apartmentId: apartment._id, committeeId: committee._id, raisedByUnitId: unit._id });

      const res = await request(app)
        .put(`/api/complaints/${complaint._id}`)
        .set(authHeader(head))
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('can resolve a complaint', async () => {
      const complaint = await createTestComplaint({ apartmentId: apartment._id, committeeId: committee._id, raisedByUnitId: unit._id });

      const res = await request(app)
        .put(`/api/complaints/${complaint._id}`)
        .set(authHeader(head))
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolvedAt).toBeTruthy();
    });

    it('returns 404 for unknown complaint', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/complaints/${fakeId}`)
        .set(authHeader(head))
        .send({ status: 'resolved' });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id/rate', () => {
    it('resident can rate a resolved complaint', async () => {
      const complaint = await createTestComplaint({
        apartmentId: apartment._id,
        committeeId: committee._id,
        raisedByUnitId: unit._id,
        status: 'resolved',
        resolvedAt: new Date(),
      });

      const res = await request(app)
        .put(`/api/complaints/${complaint._id}/rate`)
        .set(authHeader(resident))
        .send({ rating: 4 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
    });

    it('rejects rating out of range', async () => {
      const complaint = await createTestComplaint({
        apartmentId: apartment._id,
        committeeId: committee._id,
        raisedByUnitId: unit._id,
        status: 'resolved',
        resolvedAt: new Date(),
      });

      const res = await request(app)
        .put(`/api/complaints/${complaint._id}/rate`)
        .set(authHeader(resident))
        .send({ rating: 6 });

      expect(res.status).toBe(400);
    });

    it('returns 404 for unresolved complaint', async () => {
      const complaint = await createTestComplaint({
        apartmentId: apartment._id,
        committeeId: committee._id,
        raisedByUnitId: unit._id,
        status: 'open',
      });

      const res = await request(app)
        .put(`/api/complaints/${complaint._id}/rate`)
        .set(authHeader(resident))
        .send({ rating: 4 });

      expect(res.status).toBe(404);
    });
  });
});

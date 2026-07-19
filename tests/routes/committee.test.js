import request from 'supertest';
import express from 'express';
import committeeRouter from '../../src/routes/committee.js';
import { createTestApartment, createTestUser, createTestCommittee, createTestUnit, createTestCommitteeLedger, createTestMaintenanceBill, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/committee', committeeRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Committee Routes', () => {
  let apartment, head, member, committee;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    head = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      identifier: 'commhead1',
      password: 'secret123',
    });
    member = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_MEMBER,
      committeeId: committee._id,
      identifier: 'commmem1',
      password: 'secret123',
    });
    await committee.constructor.findByIdAndUpdate(committee._id, { headUserId: head._id });
  });

  describe('GET /', () => {
    it('returns committees for the apartment', async () => {
      const res = await request(app).get('/api/committee').set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /:id', () => {
    it('returns a specific committee', async () => {
      const res = await request(app).get(`/api/committee/${committee._id}`).set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(committee.name);
    });

    it('returns 404 for unknown committee', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/committee/${fakeId}`).set(authHeader(head));
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/members', () => {
    it('returns committee members', async () => {
      const res = await request(app).get(`/api/committee/${committee._id}/members`).set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /:id/members', () => {
    it('committee head can add a member', async () => {
      const res = await request(app)
        .post(`/api/committee/${committee._id}/members`)
        .set(authHeader(head))
        .send({ name: 'New Member', identifier: 'newmem1', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('committee_member');
    });

    it('rejects duplicate member identifier', async () => {
      const res = await request(app)
        .post(`/api/committee/${committee._id}/members`)
        .set(authHeader(head))
        .send({ name: 'Dup', identifier: 'newmem1', password: 'secret123' });

      expect(res.status).toBe(409);
    });

    it('regular member cannot add members', async () => {
      const res = await request(app)
        .post(`/api/committee/${committee._id}/members`)
        .set(authHeader(member))
        .send({ name: 'Bad', identifier: 'badmem', password: 'secret123' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /:committeeId/members/:memberId', () => {
    it('committee head can remove a member', async () => {
      const target = await createTestUser({
        apartmentId: apartment._id,
        type: ROLES.COMMITTEE_MEMBER,
        committeeId: committee._id,
        identifier: 'removeme',
        password: 'secret123',
      });

      const res = await request(app)
        .delete(`/api/committee/${committee._id}/members/${target._id}`)
        .set(authHeader(head));

      expect(res.status).toBe(200);
    });
  });

  describe('GET /:id/ledger', () => {
    it('returns ledger entries', async () => {
      await createTestCommitteeLedger({ apartmentId: apartment._id, committeeId: committee._id, recordedBy: head._id });

      const res = await request(app).get(`/api/committee/${committee._id}/ledger`).set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /:id/ledger', () => {
    it('committee head can create a ledger entry', async () => {
      const res = await request(app)
        .post(`/api/committee/${committee._id}/ledger`)
        .set(authHeader(head))
        .send({ type: 'income', amount: 500, description: 'Fundraiser' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(500);
    });

    it('member cannot create ledger entries', async () => {
      const res = await request(app)
        .post(`/api/committee/${committee._id}/ledger`)
        .set(authHeader(member))
        .send({ type: 'income', amount: 100, description: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /:id/bills', () => {
    it('returns bills', async () => {
      const unit = await createTestUnit({ apartmentId: apartment._id });
      await createTestMaintenanceBill({ apartmentId: apartment._id, committeeId: committee._id, unitId: unit._id });

      const res = await request(app).get(`/api/committee/${committee._id}/bills`).set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /:id/bills/generate', () => {
    it('generates bills for occupied units', async () => {
      await createTestUnit({ apartmentId: apartment._id, unitNumber: '201', status: 'occupied' });

      const res = await request(app)
        .post(`/api/committee/${committee._id}/bills/generate`)
        .set(authHeader(head))
        .send({ amount: 300, period: '2026-08', dueDate: '2026-08-15' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /bills/:billId/pay', () => {
    it('resident can pay their bill', async () => {
      const unit = await createTestUnit({ apartmentId: apartment._id, unitNumber: '301', status: 'occupied' });
      const resident = await createTestUser({
        apartmentId: apartment._id,
        type: ROLES.RESIDENT,
        identifier: 'payer',
        password: 'secret123',
        unitId: unit._id,
      });
      await unit.constructor.findByIdAndUpdate(unit._id, { residentUserId: resident._id });

      const bill = await createTestMaintenanceBill({ apartmentId: apartment._id, committeeId: committee._id, unitId: unit._id });

      const res = await request(app)
        .put(`/api/committee/bills/${bill._id}/pay`)
        .set(authHeader(resident));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('paid');
    });

    it('returns 404 for already paid bill', async () => {
      const unit = await createTestUnit({ apartmentId: apartment._id, unitNumber: '302', status: 'occupied' });
      const resident = await createTestUser({
        apartmentId: apartment._id,
        type: ROLES.RESIDENT,
        identifier: 'payer2',
        password: 'secret123',
        unitId: unit._id,
      });
      await unit.constructor.findByIdAndUpdate(unit._id, { residentUserId: resident._id });

      const bill = await createTestMaintenanceBill({ apartmentId: apartment._id, committeeId: committee._id, unitId: unit._id, status: 'paid' });

      const res = await request(app)
        .put(`/api/committee/bills/${bill._id}/pay`)
        .set(authHeader(resident));

      expect(res.status).toBe(404);
    });
  });
});

import request from 'supertest';
import express from 'express';
import visitorLogsRouter from '../../src/routes/visitorLogs.js';
import { createTestApartment, createTestUser, createTestCommittee, createTestVisitorLog, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/visitor-logs', visitorLogsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Visitor Logs Routes', () => {
  let apartment, head, member, resident, committee;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    head = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      identifier: 'vl-head',
      password: 'secret123',
    });
    member = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_MEMBER,
      committeeId: committee._id,
      identifier: 'vl-member',
      password: 'secret123',
    });
    resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'vl-res',
      password: 'secret123',
    });
  });

  describe('GET /', () => {
    it('returns visitor logs', async () => {
      await createTestVisitorLog({ apartmentId: apartment._id, loggedBy: head._id });

      const res = await request(app).get('/api/visitor-logs').set(authHeader(head));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /', () => {
    it('committee member can log a visitor', async () => {
      const res = await request(app)
        .post('/api/visitor-logs')
        .set(authHeader(member))
        .send({ visitorName: 'Alice', purpose: 'Delivery', unitVisited: '101' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.visitorName).toBe('Alice');
    });

    it('resident cannot log a visitor', async () => {
      const res = await request(app)
        .post('/api/visitor-logs')
        .set(authHeader(resident))
        .send({ visitorName: 'Bob', purpose: 'Visit', unitVisited: '102' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /:id/checkout', () => {
    it('committee member can checkout a visitor', async () => {
      const log = await createTestVisitorLog({ apartmentId: apartment._id, loggedBy: head._id, checkOut: null });

      const res = await request(app)
        .put(`/api/visitor-logs/${log._id}/checkout`)
        .set(authHeader(head));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkOut).toBeTruthy();
    });

    it('returns 404 for already checked out visitor', async () => {
      const log = await createTestVisitorLog({ apartmentId: apartment._id, loggedBy: head._id });

      await request(app)
        .put(`/api/visitor-logs/${log._id}/checkout`)
        .set(authHeader(head));

      const res = await request(app)
        .put(`/api/visitor-logs/${log._id}/checkout`)
        .set(authHeader(head));

      expect(res.status).toBe(404);
    });
  });
});

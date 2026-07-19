import request from 'supertest';
import express from 'express';
import noticesRouter from '../../src/routes/notices.js';
import { createTestApartment, createTestUser, createTestCommittee, createTestNotice, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/notices', noticesRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Notices Routes', () => {
  let apartment, committee, head, admin, resident, member;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    head = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      identifier: 'notice-head',
      password: 'secret123',
    });
    member = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_MEMBER,
      committeeId: committee._id,
      identifier: 'notice-member',
      password: 'secret123',
    });
    admin = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.APARTMENT_ADMIN,
      identifier: 'notice-admin',
      password: 'secret123',
    });
    resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'notice-res',
      password: 'secret123',
    });
  });

  describe('GET /', () => {
    it('returns notices for the apartment', async () => {
      await createTestNotice({ apartmentId: apartment._id, postedBy: head._id });

      const res = await request(app).get('/api/notices').set(authHeader(resident));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /', () => {
    it('committee head can post a notice', async () => {
      const res = await request(app)
        .post('/api/notices')
        .set(authHeader(head))
        .send({ title: 'Meeting Tomorrow', body: 'At 5pm in hall' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Meeting Tomorrow');
    });

    it('apartment admin can post a notice', async () => {
      const res = await request(app)
        .post('/api/notices')
        .set(authHeader(admin))
        .send({ title: 'Admin Notice', body: 'Important update' });

      expect(res.status).toBe(201);
    });

    it('resident cannot post a notice', async () => {
      const res = await request(app)
        .post('/api/notices')
        .set(authHeader(resident))
        .send({ title: 'Test', body: 'Test body' });

      expect(res.status).toBe(403);
    });

    it('committee member cannot post a notice', async () => {
      const res = await request(app)
        .post('/api/notices')
        .set(authHeader(member))
        .send({ title: 'Test', body: 'Test body' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /:id', () => {
    it('creator can delete their own notice', async () => {
      const notice = await createTestNotice({ apartmentId: apartment._id, postedBy: head._id });

      const res = await request(app).delete(`/api/notices/${notice._id}`).set(authHeader(head));
      expect(res.status).toBe(200);
    });

    it('cannot delete someone elses notice', async () => {
      const notice = await createTestNotice({ apartmentId: apartment._id, postedBy: head._id });

      const res = await request(app).delete(`/api/notices/${notice._id}`).set(authHeader(admin));
      expect(res.status).toBe(404);
    });

    it('returns 404 for unknown notice', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).delete(`/api/notices/${fakeId}`).set(authHeader(head));
      expect(res.status).toBe(404);
    });
  });
});

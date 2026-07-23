import request from 'supertest';
import express from 'express';
import notificationsRouter from '../../src/routes/notifications.js';
import { createTestApartment, createTestUser, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';
import { Notification } from '../../src/models/index.js';

beforeAll(async () => { await startDB(); await clearDB(); }, 30000);

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Notifications Routes', () => {
  let apartment, user;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    user = await createTestUser({ apartmentId: apartment._id, type: ROLES.RESIDENT, identifier: 'notif-res' });
    await Notification.insertMany([
      { apartmentId: apartment._id, userId: user._id, type: 'info', message: 'Test 1', link: '/test', read: false },
      { apartmentId: apartment._id, userId: user._id, type: 'notice', message: 'Test 2', link: '/notices', read: true },
    ]);
  });

  describe('GET /', () => {
    it('returns notifications for the current user', async () => {
      const res = await request(app).get('/api/notifications').set(authHeader(user));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /unread-count', () => {
    it('returns unread count', async () => {
      const res = await request(app).get('/api/notifications/unread-count').set(authHeader(user));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('PUT /:id/read', () => {
    it('marks a notification as read', async () => {
      const notif = await Notification.findOne({ userId: user._id, read: false });
      const res = await request(app).put(`/api/notifications/${notif._id}/read`).set(authHeader(user));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const updated = await Notification.findById(notif._id);
      expect(updated.read).toBe(true);
    });

    it('returns 404 for unknown notification', async () => {
      const res = await request(app).put('/api/notifications/507f1f77bcf86cd799439011/read').set(authHeader(user));
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /read-all', () => {
    it('marks all as read', async () => {
      const res = await request(app).put('/api/notifications/read-all').set(authHeader(user));
      expect(res.status).toBe(200);
      const count = await Notification.countDocuments({ userId: user._id, read: false });
      expect(count).toBe(0);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a notification', async () => {
      const notif = await Notification.findOne({ userId: user._id });
      const res = await request(app).delete(`/api/notifications/${notif._id}`).set(authHeader(user));
      expect(res.status).toBe(200);
      const deleted = await Notification.findById(notif._id);
      expect(deleted).toBeNull();
    });
  });
});

import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import uploadsRouter from '../../src/routes/uploads.js';
import { createTestApartment, createTestUser, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';
import { Upload } from '../../src/models/index.js';

beforeAll(async () => { await startDB(); await clearDB(); }, 30000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use('/api/uploads', uploadsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Uploads Routes', () => {
  let apartment, user;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    user = await createTestUser({ apartmentId: apartment._id, type: ROLES.RESIDENT, identifier: 'up-res' });
  });

  describe('GET /:id', () => {
    it('returns 400 for invalid ObjectId', async () => {
      const res = await request(app).get('/api/uploads/invalid-id').set(authHeader(user));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for unknown upload', async () => {
      const res = await request(app).get('/api/uploads/507f1f77bcf86cd799439011').set(authHeader(user));
      expect(res.status).toBe(404);
    });
  });
});

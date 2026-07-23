import request from 'supertest';
import express from 'express';
import analyticsRouter from '../../src/routes/analytics.js';
import { authenticate, tenantIsolation } from '../../src/middleware/auth.js';
import { createTestApartment, createTestUser, createTestPlan, createTestSaaSInvoice, createTestUnit, createTestCommittee, createTestComplaint, createTestVisitorLog, createTestCommitteeLedger, createTestMaintenanceBill, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => { await startDB(); await clearDB(); }, 30000);

const app = express();
app.use(express.json());
app.use('/api/analytics', authenticate, tenantIsolation, analyticsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Analytics Routes', () => {
  let apartment, siteAdmin, aptAdmin;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    const plan = await createTestPlan();
    const committee = await createTestCommittee({ apartmentId: apartment._id });
    const unit = await createTestUnit({ apartmentId: apartment._id, status: 'occupied' });
    await createTestUnit({ apartmentId: apartment._id, status: 'vacant' });
    siteAdmin = await createTestUser({ type: ROLES.SITE_ADMIN, identifier: 'an-site' });
    aptAdmin = await createTestUser({ apartmentId: apartment._id, type: ROLES.APARTMENT_ADMIN, identifier: 'an-aptadmin' });
    await createTestSaaSInvoice({ apartmentId: apartment._id, planId: plan._id, amount: 200, status: 'paid' });
    await createTestComplaint({ apartmentId: apartment._id, committeeId: committee._id, raisedByUnitId: unit._id });
    await createTestVisitorLog({ apartmentId: apartment._id, loggedBy: aptAdmin._id });
    await createTestCommitteeLedger({ apartmentId: apartment._id, committeeId: committee._id, recordedBy: aptAdmin._id, type: 'income', amount: 5000 });
    await createTestCommitteeLedger({ apartmentId: apartment._id, committeeId: committee._id, recordedBy: aptAdmin._id, type: 'expense', amount: 2000 });
    await createTestMaintenanceBill({ apartmentId: apartment._id, committeeId: committee._id, unitId: unit._id, amount: 300, status: 'paid' });
    await createTestMaintenanceBill({ apartmentId: apartment._id, committeeId: committee._id, unitId: unit._id, amount: 150, status: 'unpaid' });
  });

  describe('GET /overview', () => {
    it('returns analytics overview for site_admin', async () => {
      const res = await request(app).get('/api/analytics/overview').set(authHeader(siteAdmin));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apartments.total).toBe(1);
      expect(res.body.data.revenue.total).toBe(200);
      expect(res.body.data.units.total).toBe(2);
      expect(res.body.data.complaints).toBeDefined();
      expect(res.body.data.visitors.total).toBe(1);
    });

    it('returns analytics overview for apartment_admin with scoped data', async () => {
      const res = await request(app).get('/api/analytics/overview').set(authHeader(aptAdmin));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.units.total).toBe(2);
    });
  });

  describe('GET /revenue-trend', () => {
    it('returns revenue trend for site_admin', async () => {
      const res = await request(app).get('/api/analytics/revenue-trend').set(authHeader(siteAdmin));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

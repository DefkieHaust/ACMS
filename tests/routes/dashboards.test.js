import request from 'supertest';
import express from 'express';
import dashboardsRouter from '../../src/routes/dashboards.js';
import { createTestApartment, createTestPlan, createTestUser, createTestUnit, createTestCommittee, createTestSaaSInvoice, createTestMaintenanceBill, createTestCommitteeLedger, createTestComplaint, createTestNotice, createTestVisitorLog, getAuthToken } from '../setup.js';
import { ROLES } from '../../src/config/constants.js';
import { startDB, clearDB } from '../db.js';

beforeAll(async () => {
  await startDB();
  await clearDB();
}, 30000);

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardsRouter);

function authHeader(user) {
  return { authorization: `Bearer ${getAuthToken(user)}` };
}

describe('Dashboard - Site Admin', () => {
  let admin;

  beforeAll(async () => {
    await clearDB();
    admin = await createTestUser({ type: ROLES.SITE_ADMIN });
  });

  it('returns site admin dashboard stats', async () => {
    const plan = await createTestPlan();
    const apt = await createTestApartment({ planId: plan._id });
    await createTestSaaSInvoice({ apartmentId: apt._id, planId: plan._id });

    const res = await request(app).get('/api/dashboard/site-admin').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalApartments).toBe(1);
    expect(res.body.data.totalPlans).toBe(1);
    expect(res.body.data.totalInvoices).toBe(1);
    expect(res.body.data.totalRevenue).toBeGreaterThan(0);
  });

  it('returns 403 for non-site-admin', async () => {
    const user = await createTestUser({ type: ROLES.RESIDENT, apartmentId: (await createTestApartment())._id });
    const res = await request(app).get('/api/dashboard/site-admin').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});

describe('Dashboard - Apartment Admin', () => {
  let admin, apartment;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    admin = await createTestUser({ type: ROLES.APARTMENT_ADMIN, apartmentId: apartment._id });
  });

  it('returns apartment admin dashboard stats', async () => {
    const unit = await createTestUnit({ apartmentId: apartment._id });

    const res = await request(app).get('/api/dashboard/apartment-admin').set(authHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUnits).toBe(1);
  });
});

describe('Dashboard - Committee Head', () => {
  let head, committee, apartment;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    head = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.COMMITTEE_HEAD,
      committeeId: committee._id,
      identifier: 'dash-head',
      password: 'secret123',
    });
  });

  it('returns committee head dashboard stats', async () => {
    const res = await request(app).get('/api/dashboard/committee-head').set(authHeader(head));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.committee).toBeDefined();
    expect(res.body.data.totalIncome).toBeDefined();
  });
});

describe('Dashboard - Resident', () => {
  let resident, apartment, unit, committee;

  beforeAll(async () => {
    await clearDB();
    apartment = await createTestApartment();
    committee = await createTestCommittee({ apartmentId: apartment._id });
    unit = await createTestUnit({ apartmentId: apartment._id, status: 'occupied' });
    resident = await createTestUser({
      apartmentId: apartment._id,
      type: ROLES.RESIDENT,
      identifier: 'dash-res',
      password: 'secret123',
      unitId: unit._id,
    });
    await unit.constructor.findByIdAndUpdate(unit._id, { residentUserId: resident._id });
  });

  it('returns resident dashboard stats', async () => {
    const res = await request(app).get('/api/dashboard/resident').set(authHeader(resident));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unit).toBeDefined();
    expect(res.body.data.bills).toBeDefined();
    expect(res.body.data.complaints).toBeDefined();
    expect(res.body.data.notices).toBeDefined();
  });
});

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import authRouter from '../src/routes/auth.js';
import siteAdminRouter from '../src/routes/siteAdmin.js';
import apartmentAdminRouter from '../src/routes/apartmentAdmin.js';
import committeeRouter from '../src/routes/committee.js';
import complaintRouter from '../src/routes/complaints.js';
import visitorLogRouter from '../src/routes/visitorLogs.js';
import noticeRouter from '../src/routes/notices.js';
import dashboardRouter from '../src/routes/dashboards.js';
import userRouter from '../src/routes/users.js';
import exportRouter from '../src/routes/export.js';

import { hashPassword } from '../src/utils/helpers.js';
import { config } from '../src/config/index.js';
import { ROLES } from '../src/config/constants.js';
import { Apartment, Plan, User, Unit, Committee, CommitteeLedger, MaintenanceBill, SaaSInvoice, Complaint, VisitorLog, Notice, AuditLog } from '../src/models/index.js';
import { startDB } from './db.js';

let app;
const T = {}; // tokens
const E = {}; // entities

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function token(user) {
  return jwt.sign(
    { userId: user._id, type: user.type, apartmentId: user.apartmentId || null, committeeId: user.committeeId || null, unitId: user.unitId || null },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

beforeAll(async () => {
  await startDB();
  // Clean database from any prior run
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/admin', siteAdminRouter);
  app.use('/api/apartment', apartmentAdminRouter);
  app.use('/api/committees', committeeRouter);
  app.use('/api/complaints', complaintRouter);
  app.use('/api/visitors', visitorLogRouter);
  app.use('/api/notices', noticeRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/users', userRouter);
  app.use('/api/export', exportRouter);

  // Seed all data once
  const saPw = await hashPassword('admin123');
  const sa = await User.create({ type: 'site_admin', name: 'SA', identifier: 'superadmin', passwordHash: saPw, status: 'active' });
  T.sa = token(sa); E.sa = sa;

  const plan = await Plan.create({ name: 'Standard', priceType: 'flat', price: 99.99, currency: 'USD' });
  const plan2 = await Plan.create({ name: 'Premium', priceType: 'per-unit', price: 15, currency: 'USD' });
  E.plan = plan; E.plan2 = plan2;

  const apt = await Apartment.create({ name: `apt-${uid()}`, address: '123 St', city: 'NYC', country: 'USA', apartmentType: 'residential', defaultCurrency: 'USD', planId: plan._id, status: 'active' });
  E.apt = apt;

  const aaPw = await hashPassword('pass123');
  const aa = await User.create({ apartmentId: apt._id, type: 'apartment_admin', name: 'AA', identifier: 'aptadmin', passwordHash: aaPw, status: 'active' });
  T.aa = token(aa); E.aa = aa;

  const u1 = await Unit.create({ apartmentId: apt._id, unitNumber: `U-${uid()}`, unitType: 'apartment', status: 'vacant' });
  const u2 = await Unit.create({ apartmentId: apt._id, unitNumber: `U-${uid()}`, unitType: 'studio', status: 'vacant' });
  E.u1 = u1; E.u2 = u2;

  const rPw = await hashPassword('pass123');
  const res = await User.create({ apartmentId: apt._id, type: 'resident', name: 'Jane', identifier: `jane-${uid()}`, passwordHash: rPw, status: 'active', unitId: u1._id, residentType: 'tenant' });
  await Unit.findByIdAndUpdate(u1._id, { residentUserId: res._id, status: 'occupied' });
  T.res = token(res); E.res = res;

  const com = await Committee.create({ apartmentId: apt._id, name: `com-${uid()}`, description: 'Test committee', status: 'active' });
  E.com = com;

  const chPw = await hashPassword('pass123');
  const ch = await User.create({ apartmentId: apt._id, type: 'committee_head', name: 'CH', identifier: `head-${uid()}`, passwordHash: chPw, status: 'active', committeeId: com._id });
  await Committee.findByIdAndUpdate(com._id, { headUserId: ch._id });
  T.ch = token(ch); E.ch = ch;

  const cmPw = await hashPassword('pass123');
  const cm = await User.create({ apartmentId: apt._id, type: 'committee_member', name: 'CM', identifier: `mem-${uid()}`, passwordHash: cmPw, status: 'active', committeeId: com._id });
  await Committee.findByIdAndUpdate(com._id, { $push: { members: { userId: cm._id, role: 'committee_member' } } });
  T.cm = token(cm); E.cm = cm;

  E.inv = await SaaSInvoice.create({ apartmentId: apt._id, planId: plan._id, period: '2026-07', amount: 99.99, currency: 'USD', status: 'unpaid', dueDate: new Date('2026-08-01') });
  E.bill = await MaintenanceBill.create({ apartmentId: apt._id, committeeId: com._id, unitId: u1._id, amount: 200, currency: 'USD', period: '2026-07', status: 'unpaid', dueDate: new Date('2026-08-15') });
  E.ledger = await CommitteeLedger.create({ apartmentId: apt._id, committeeId: com._id, type: 'income', amount: 5000, description: 'Fees', recordedBy: ch._id });
  E.complaint = await Complaint.create({ apartmentId: apt._id, committeeId: com._id, raisedByUnitId: u1._id, description: 'Test complaint', status: 'open' });
  E.vlog = await VisitorLog.create({ apartmentId: apt._id, visitorName: 'Guest', purpose: 'Visit', unitVisited: 'A-101', loggedBy: cm._id });
  E.notice = await Notice.create({ apartmentId: apt._id, committeeId: com._id, title: 'Test', body: 'Test body', postedBy: ch._id });
}, 60000);

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
  await mongoose.disconnect();
}, 30000);

// ======================== TESTS ========================

describe('ACMS E2E', () => {
  describe('Auth', () => {
    test('Login site_admin', async () => {
      const r = await request(app).post('/api/auth/login').send({ type: 'site_admin', identifier: 'superadmin', password: 'admin123' });
      expect(r.status).toBe(200); expect(r.body.data.token).toBeDefined();
    });

    test('Login resident', async () => {
      const r = await request(app).post('/api/auth/login').send({ apartmentName: E.apt.name, type: 'resident', identifier: E.res.identifier, password: 'pass123' });
      expect(r.status).toBe(200); expect(r.body.data.user.type).toBe('resident');
    });

    test('Change password', async () => {
      const r = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${T.res}`).send({ currentPassword: 'pass123', newPassword: 'newpass' });
      expect(r.status).toBe(200);
    });

    test('Reject wrong current password', async () => {
      const r = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${T.res}`).send({ currentPassword: 'wrong', newPassword: 'newpass' });
      expect(r.status).toBe(401);
    });
  });

  describe('Plans CRUD', () => {
    test('GET /admin/plans', async () => {
      const r = await request(app).get('/api/admin/plans').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(2);
    });

    test('POST /admin/plans', async () => {
      const r = await request(app).post('/api/admin/plans').set('Authorization', `Bearer ${T.sa}`).send({ name: 'New Plan', priceType: 'flat', price: 50 });
      expect(r.status).toBe(201);
    });

    test('PUT /admin/plans/:id', async () => {
      const r = await request(app).put(`/api/admin/plans/${E.plan._id}`).set('Authorization', `Bearer ${T.sa}`).send({ name: 'Standard', priceType: 'flat', price: 49.99 });
      expect(r.status).toBe(200); expect(r.body.data.price).toBe(49.99);
    });

    test('DELETE /admin/plans/:id', async () => {
      const p = await Plan.create({ name: `del-${uid()}`, priceType: 'flat', price: 10 });
      const r = await request(app).delete(`/api/admin/plans/${p._id}`).set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200);
    });
  });

  describe('Apartments CRUD', () => {
    test('GET /admin/apartments', async () => {
      const r = await request(app).get('/api/admin/apartments').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST /admin/apartments', async () => {
      const r = await request(app).post('/api/admin/apartments').set('Authorization', `Bearer ${T.sa}`).send({ name: 'New Apt', address: '456 Elm', city: 'Boston', country: 'USA', apartmentType: 'commercial' });
      expect(r.status).toBe(201); expect(r.body.data.apartmentType).toBe('commercial');
    });

    test('PUT /admin/apartments/:id WITH planId string', async () => {
      const r = await request(app).put(`/api/admin/apartments/${E.apt._id}`).set('Authorization', `Bearer ${T.sa}`).send({ address: 'Updated St', planId: E.plan2._id.toString() });
      expect(r.status).toBe(200); expect(r.body.data.address).toBe('Updated St');
    });

    test('PUT /admin/apartments/:id WITH planId=null (remove plan)', async () => {
      const r = await request(app).put(`/api/admin/apartments/${E.apt._id}`).set('Authorization', `Bearer ${T.sa}`).send({ planId: null });
      expect(r.status).toBe(200); expect(r.body.data.planId).toBeNull();
    });

    test('PUT /admin/apartments/:id WITHOUT planId', async () => {
      const r = await request(app).put(`/api/admin/apartments/${E.apt._id}`).set('Authorization', `Bearer ${T.sa}`).send({ city: 'Chicago' });
      expect(r.status).toBe(200); expect(r.body.data.city).toBe('Chicago');
    });

    test('POST /admin/apartments reject duplicate', async () => {
      const r = await request(app).post('/api/admin/apartments').set('Authorization', `Bearer ${T.sa}`).send({ name: E.apt.name, address: 'Dup' });
      expect(r.status).toBe(409);
    });

    test('Search apartments', async () => {
      const r = await request(app).get('/api/admin/apartments?search=apt').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Invoices', () => {
    test('GET /admin/invoices', async () => {
      const r = await request(app).get('/api/admin/invoices').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('Mark paid', async () => {
      const r = await request(app).put(`/api/admin/invoices/${E.inv._id}/mark-paid`).set('Authorization', `Bearer ${T.sa}`).send({ status: 'paid' });
      expect(r.status).toBe(200); expect(r.body.data.status).toBe('paid');
    });
  });

  describe('Units CRUD', () => {
    test('GET /apartment/units', async () => {
      const r = await request(app).get('/api/apartment/units').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('POST /apartment/units', async () => {
      const r = await request(app).post('/api/apartment/units').set('Authorization', `Bearer ${T.aa}`).send({ unitNumber: `U-${uid()}`, unitType: 'penthouse' });
      expect(r.status).toBe(201);
    });

    test('PUT /apartment/units/:id', async () => {
      const r = await request(app).put(`/api/apartment/units/${E.u1._id}`).set('Authorization', `Bearer ${T.aa}`).send({ unitType: 'duplex' });
      expect(r.status).toBe(200); expect(r.body.data.unitType).toBe('duplex');
    });

    test('DELETE /apartment/units/:id', async () => {
      const u = await Unit.create({ apartmentId: E.apt._id, unitNumber: `U-${uid()}` });
      const r = await request(app).delete(`/api/apartment/units/${u._id}`).set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200);
    });
  });

  describe('Residents CRUD', () => {
    test('GET /apartment/residents', async () => {
      const r = await request(app).get('/api/apartment/residents').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST /apartment/residents with residentType, phone, identityNumber', async () => {
      const r = await request(app).post('/api/apartment/residents').set('Authorization', `Bearer ${T.aa}`).send({
        type: 'resident', name: 'New Res', identifier: `new-${uid()}`, password: 'pass123456', residentType: 'owner', phone: ['+111'], identityNumber: 'ID-X'
      });
      expect(r.status).toBe(201); expect(r.body.data.residentType).toBe('owner');
    });

    test('PUT /apartment/residents/:id', async () => {
      const r = await request(app).put(`/api/apartment/residents/${E.res._id}`).set('Authorization', `Bearer ${T.aa}`).send({ name: 'Updated', residentType: 'owner' });
      expect(r.status).toBe(200); expect(r.body.data.name).toBe('Updated');
    });

    test('Search residents', async () => {
      const r = await request(app).get('/api/apartment/residents?search=Jane').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200);
    });
  });

  describe('Committees CRUD', () => {
    test('GET /apartment/committees', async () => {
      const r = await request(app).get('/api/apartment/committees').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
      expect(r.body.data[0].description).toBe('Test committee');
    });

    test('POST /apartment/committees with description', async () => {
      const r = await request(app).post('/api/apartment/committees').set('Authorization', `Bearer ${T.aa}`).send({ name: `new-${uid()}`, description: 'New committee' });
      expect(r.status).toBe(201); expect(r.body.data.description).toBe('New committee');
    });

    test('PUT /apartment/committees/:id', async () => {
      const r = await request(app).put(`/api/apartment/committees/${E.com._id}`).set('Authorization', `Bearer ${T.aa}`).send({ description: 'Updated' });
      expect(r.status).toBe(200); expect(r.body.data.description).toBe('Updated');
    });
  });

  describe('Committee Members', () => {
    let disposableUser;

    beforeAll(async () => {
      const dpw = await hashPassword('pass123');
      disposableUser = await User.create({
        apartmentId: E.apt._id, type: 'resident', name: 'Disposable', identifier: `disp-${uid()}`, passwordHash: dpw, status: 'active', residentType: 'tenant',
      });
    });

    test('GET /committees/:id/members', async () => {
      const r = await request(app).get(`/api/committees/${E.com._id}/members`).set('Authorization', `Bearer ${T.ch}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(2);
    });

    test('POST /committees/:id/members add existing', async () => {
      const r = await request(app).post(`/api/committees/${E.com._id}/members`).set('Authorization', `Bearer ${T.ch}`).send({ userId: disposableUser._id.toString() });
      expect(r.status).toBe(201);
    });

    test('PUT role', async () => {
      const r = await request(app).put(`/api/committees/${E.com._id}/members/${disposableUser._id}/role`).set('Authorization', `Bearer ${T.ch}`).send({ customRole: 'Treasurer' });
      expect(r.status).toBe(200);
    });

    test('DELETE member', async () => {
      await request(app).post(`/api/committees/${E.com._id}/members`).set('Authorization', `Bearer ${T.ch}`).send({ userId: disposableUser._id.toString() });
      const r = await request(app).delete(`/api/committees/${E.com._id}/members/${disposableUser._id}`).set('Authorization', `Bearer ${T.ch}`);
      expect(r.status).toBe(200);
    });

    test('Member cannot add', async () => {
      const r = await request(app).post(`/api/committees/${E.com._id}/members`).set('Authorization', `Bearer ${T.cm}`).send({ userId: disposableUser._id.toString() });
      expect(r.status).toBe(403);
    });
  });

  describe('Custom Roles', () => {
    test('CRD custom roles', async () => {
      const c = await request(app).post(`/api/committees/${E.com._id}/roles`).set('Authorization', `Bearer ${T.ch}`).send({ name: 'Secretary' });
      expect(c.status).toBe(201);
      const g = await request(app).get(`/api/committees/${E.com._id}/roles`).set('Authorization', `Bearer ${T.ch}`);
      expect(g.status).toBe(200); expect(g.body.data.length).toBe(1);
      const d = await request(app).delete(`/api/committees/${E.com._id}/roles/${c.body.data._id}`).set('Authorization', `Bearer ${T.ch}`);
      expect(d.status).toBe(200);
    });
  });

  describe('Ledger', () => {
    test('GET /committees/:id/ledger', async () => {
      const r = await request(app).get(`/api/committees/${E.com._id}/ledger`).set('Authorization', `Bearer ${T.ch}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST head can create', async () => {
      const r = await request(app).post(`/api/committees/${E.com._id}/ledger`).set('Authorization', `Bearer ${T.ch}`).send({ type: 'expense', amount: 1000, description: 'Repairs' });
      expect(r.status).toBe(201);
    });

    test('POST member cannot create', async () => {
      const r = await request(app).post(`/api/committees/${E.com._id}/ledger`).set('Authorization', `Bearer ${T.cm}`).send({ type: 'income', amount: 100, description: 'No' });
      expect(r.status).toBe(403);
    });
  });

  describe('Bills', () => {
    test('GET /committees/:id/bills', async () => {
      const r = await request(app).get(`/api/committees/${E.com._id}/bills`).set('Authorization', `Bearer ${T.ch}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST generate bills', async () => {
      const r = await request(app).post(`/api/committees/${E.com._id}/bills/generate`).set('Authorization', `Bearer ${T.ch}`).send({ amount: 150, period: '2026-08', dueDate: '2026-09-01', currency: 'USD' });
      expect(r.status).toBe(201);
    });

    test('PUT pay bill', async () => {
      const r = await request(app).put(`/api/committees/bills/${E.bill._id}/pay`).set('Authorization', `Bearer ${T.res}`);
      expect(r.status).toBe(200);
    });
  });

  describe('Complaints', () => {
    test('POST resident creates', async () => {
      const r = await request(app).post('/api/complaints').set('Authorization', `Bearer ${T.res}`).send({ committeeId: E.com._id.toString(), description: 'Noise' });
      expect(r.status).toBe(201);
    });

    test('POST member cannot', async () => {
      const r = await request(app).post('/api/complaints').set('Authorization', `Bearer ${T.cm}`).send({ committeeId: E.com._id.toString(), description: 'No' });
      expect(r.status).toBe(403);
    });

    test('PUT update status', async () => {
      const r = await request(app).put(`/api/complaints/${E.complaint._id}`).set('Authorization', `Bearer ${T.ch}`).send({ status: 'in_progress' });
      expect(r.status).toBe(200);
    });

    test('PUT resolve', async () => {
      const r = await request(app).put(`/api/complaints/${E.complaint._id}`).set('Authorization', `Bearer ${T.ch}`).send({ status: 'resolved' });
      expect(r.status).toBe(200);
    });

    test('PUT rate', async () => {
      await Complaint.findByIdAndUpdate(E.complaint._id, { status: 'resolved' });
      const r = await request(app).put(`/api/complaints/${E.complaint._id}/rate`).set('Authorization', `Bearer ${T.res}`).send({ rating: 4 });
      expect(r.status).toBe(200); expect(r.body.data.rating).toBe(4);
    });
  });

  describe('Visitor Log', () => {
    test('GET /api/visitors', async () => {
      const r = await request(app).get('/api/visitors').set('Authorization', `Bearer ${T.cm}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST member creates', async () => {
      const r = await request(app).post('/api/visitors').set('Authorization', `Bearer ${T.cm}`).send({ visitorName: 'Guest', purpose: 'Delivery', unitVisited: 'A-101' });
      expect(r.status).toBe(201);
    });

    test('PUT checkout', async () => {
      const r = await request(app).put(`/api/visitors/${E.vlog._id}/checkout`).set('Authorization', `Bearer ${T.cm}`);
      expect(r.status).toBe(200); expect(r.body.data.checkOut).toBeDefined();
    });

    test('POST resident cannot', async () => {
      const r = await request(app).post('/api/visitors').set('Authorization', `Bearer ${T.res}`).send({ visitorName: 'G', purpose: 'V', unitVisited: 'A-101' });
      expect(r.status).toBe(403);
    });
  });

  describe('Notices', () => {
    test('GET /api/notices', async () => {
      const r = await request(app).get('/api/notices').set('Authorization', `Bearer ${T.res}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBe(1);
    });

    test('POST head creates', async () => {
      const r = await request(app).post('/api/notices').set('Authorization', `Bearer ${T.ch}`).send({ title: 'Meeting', body: 'Friday' });
      expect(r.status).toBe(201);
    });

    test('POST resident cannot', async () => {
      const r = await request(app).post('/api/notices').set('Authorization', `Bearer ${T.res}`).send({ title: 'N', body: 'N' });
      expect(r.status).toBe(403);
    });

    test('POST member cannot', async () => {
      const r = await request(app).post('/api/notices').set('Authorization', `Bearer ${T.cm}`).send({ title: 'N', body: 'N' });
      expect(r.status).toBe(403);
    });

    test('DELETE own notice', async () => {
      const cr = await request(app).post('/api/notices').set('Authorization', `Bearer ${T.ch}`).send({ title: 'Del', body: 'Delete me' });
      expect(cr.status).toBe(201);
      const dr = await request(app).delete(`/api/notices/${cr.body.data._id}`).set('Authorization', `Bearer ${T.ch}`);
      expect(dr.status).toBe(200);
    });

    test('DELETE not own notice fails', async () => {
      const r = await request(app).delete(`/api/notices/${E.notice._id}`).set('Authorization', `Bearer ${T.res}`);
      expect(r.status).toBe(404);
    });
  });

  describe('Dashboards', () => {
    test('Site admin', async () => {
      const r = await request(app).get('/api/dashboard/site-admin').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.totalApartments).toBe(2);
    });
    test('Apartment admin', async () => {
      const r = await request(app).get('/api/dashboard/apartment-admin').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.body.data.totalUnits).toBeGreaterThan(0);
    });
    test('Committee head', async () => {
      const r = await request(app).get('/api/dashboard/committee-head').set('Authorization', `Bearer ${T.ch}`);
      expect(r.status).toBe(200); expect(r.body.data.members).toBeGreaterThan(0);
    });
    test('Resident', async () => {
      const r = await request(app).get('/api/dashboard/resident').set('Authorization', `Bearer ${T.res}`);
      expect(r.status).toBe(200); expect(r.body.data.unit).toBeDefined();
    });
  });

  describe('User Management', () => {
    test('GET /api/users list', async () => {
      const r = await request(app).get('/api/users').set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200); expect(r.body.data.length).toBeGreaterThan(2);
    });
    test('GET /api/users/:id', async () => {
      const r = await request(app).get(`/api/users/${E.res._id}`).set('Authorization', `Bearer ${T.sa}`);
      expect(r.status).toBe(200);
    });
    test('PUT /api/users/:id', async () => {
      const r = await request(app).put(`/api/users/${E.res._id}`).set('Authorization', `Bearer ${T.sa}`).send({ name: 'UpdatedName' });
      expect(r.status).toBe(200);
    });
  });

  describe('CSV Exports', () => {
    test('Residents CSV', async () => {
      const r = await request(app).get('/api/export/residents').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.headers['content-type']).toContain('text/csv');
    });
    test('Units CSV', async () => {
      const r = await request(app).get('/api/export/units').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.headers['content-type']).toContain('text/csv');
    });
    test('Complaints CSV', async () => {
      const r = await request(app).get('/api/export/complaints').set('Authorization', `Bearer ${T.aa}`);
      expect(r.status).toBe(200); expect(r.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Audit', () => {
    test('Audit logs exist', async () => {
      const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(5);
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});

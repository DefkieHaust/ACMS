import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../src/utils/helpers.js';
import { Apartment, Plan, User, Unit, Committee, CommitteeLedger, MaintenanceBill, SaaSInvoice, Complaint, VisitorLog, Notice } from '../src/models/index.js';
import { ROLES } from '../src/config/constants.js';
import { config } from '../src/config/index.js';

let _counter = 0;
function uid() { _counter++; return `${_counter}-${Date.now()}`; }

export async function createTestApartment(overrides = {}) {
  const id = uid();
  return Apartment.create({
    name: `apt-${id}`,
    address: '123 Test St',
    status: 'active',
    ...overrides,
  });
}

export async function createTestPlan(overrides = {}) {
  const id = uid();
  return Plan.create({
    name: `plan-${id}`,
    priceType: 'flat',
    price: 100,
    billingCycle: 'monthly',
    ...overrides,
  });
}

export async function createTestUser(overrides = {}) {
  const id = uid();
  const passwordHash = await hashPassword(overrides.password || 'password123');
  return User.create({
    apartmentId: null,
    type: ROLES.SITE_ADMIN,
    name: 'Admin User',
    identifier: `user-${id}`,
    passwordHash,
    ...overrides,
  });
}

export async function createTestUnit(overrides = {}) {
  const id = uid();
  return Unit.create({
    apartmentId: overrides.apartmentId || null,
    unitNumber: `U-${id}`,
    status: 'vacant',
    ...overrides,
  });
}

export async function createTestCommittee(overrides = {}) {
  const id = uid();
  return Committee.create({
    apartmentId: overrides.apartmentId || null,
    name: `Committee-${id}`,
    status: 'active',
    ...overrides,
  });
}

export async function createTestSaaSInvoice(overrides = {}) {
  return SaaSInvoice.create({
    apartmentId: overrides.apartmentId || null,
    planId: overrides.planId || null,
    period: '2026-07',
    amount: 100,
    status: 'unpaid',
    dueDate: new Date('2026-08-01'),
    ...overrides,
  });
}

export async function createTestMaintenanceBill(overrides = {}) {
  return MaintenanceBill.create({
    apartmentId: overrides.apartmentId || null,
    committeeId: overrides.committeeId || null,
    unitId: overrides.unitId || null,
    amount: 500,
    period: '2026-07',
    status: 'unpaid',
    dueDate: new Date('2026-08-01'),
    ...overrides,
  });
}

export async function createTestCommitteeLedger(overrides = {}) {
  return CommitteeLedger.create({
    apartmentId: overrides.apartmentId || null,
    committeeId: overrides.committeeId || null,
    type: 'income',
    amount: 1000,
    description: 'Test entry',
    recordedBy: overrides.recordedBy || null,
    ...overrides,
  });
}

export async function createTestComplaint(overrides = {}) {
  return Complaint.create({
    apartmentId: overrides.apartmentId || null,
    committeeId: overrides.committeeId || null,
    raisedByUnitId: overrides.raisedByUnitId || null,
    description: 'Test complaint',
    status: 'open',
    ...overrides,
  });
}

export async function createTestVisitorLog(overrides = {}) {
  return VisitorLog.create({
    apartmentId: overrides.apartmentId || null,
    visitorName: 'John Doe',
    purpose: 'Visit',
    unitVisited: '101',
    loggedBy: overrides.loggedBy || null,
    ...overrides,
  });
}

export async function createTestNotice(overrides = {}) {
  return Notice.create({
    apartmentId: overrides.apartmentId || null,
    committeeId: overrides.committeeId || null,
    title: 'Test Notice',
    body: 'This is a test notice body.',
    postedBy: overrides.postedBy || null,
    ...overrides,
  });
}

export function getAuthToken(user) {
  return jwt.sign(
    { userId: user._id, type: user.type, apartmentId: user.apartmentId, committeeId: user.committeeId, unitId: user.unitId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

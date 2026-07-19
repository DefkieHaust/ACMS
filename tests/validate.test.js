import {
  loginSchema,
  createApartmentSchema,
  updateApartmentSchema,
  createPlanSchema,
  createUserSchema,
  createUnitSchema,
  createCommitteeSchema,
  createCommitteeHeadSchema,
  createCommitteeMemberSchema,
  ledgerEntrySchema,
  generateBillsSchema,
  createComplaintSchema,
  updateComplaintSchema,
  createVisitorLogSchema,
  createNoticeSchema,
  markInvoicePaidSchema,
} from '../src/utils/validate.js';

describe('loginSchema', () => {
  it('accepts site_admin login without apartmentName', () => {
    const result = loginSchema.safeParse({ type: 'site_admin', identifier: 'admin', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('accepts resident login with apartmentName', () => {
    const result = loginSchema.safeParse({ apartmentName: 'myapt', type: 'resident', identifier: 'user1', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('rejects empty identifier', () => {
    const result = loginSchema.safeParse({ type: 'site_admin', identifier: '', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ type: 'site_admin', identifier: 'admin', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role type', () => {
    const result = loginSchema.safeParse({ type: 'superadmin', identifier: 'admin', password: 'pass' });
    expect(result.success).toBe(false);
  });
});

describe('createApartmentSchema', () => {
  it('accepts valid apartment data', () => {
    const result = createApartmentSchema.safeParse({ name: ' My Apartment ', address: '456 Oak St' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('my apartment');
  });

  it('rejects empty name', () => {
    const result = createApartmentSchema.safeParse({ name: '', address: 'addr' });
    expect(result.success).toBe(false);
  });

  it('rejects empty address', () => {
    const result = createApartmentSchema.safeParse({ name: 'apt', address: '' });
    expect(result.success).toBe(false);
  });
});

describe('updateApartmentSchema', () => {
  it('accepts partial update', () => {
    const result = updateApartmentSchema.safeParse({ status: 'suspended' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateApartmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateApartmentSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });
});

describe('createPlanSchema', () => {
  it('accepts valid flat plan', () => {
    const result = createPlanSchema.safeParse({ name: 'Premium', priceType: 'flat', price: 200 });
    expect(result.success).toBe(true);
  });

  it('accepts valid per-unit plan', () => {
    const result = createPlanSchema.safeParse({ name: 'Pro', priceType: 'per-unit', price: 50, features: ['A', 'B'] });
    expect(result.success).toBe(true);
  });

  it('rejects zero price', () => {
    const result = createPlanSchema.safeParse({ name: 'Free', priceType: 'flat', price: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = createPlanSchema.safeParse({ name: 'Free', priceType: 'flat', price: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createPlanSchema.safeParse({ name: '', priceType: 'flat', price: 100 });
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  it('accepts valid resident user', () => {
    const result = createUserSchema.safeParse({
      type: 'resident', name: 'Jane', identifier: 'jane123', password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = createUserSchema.safeParse({
      type: 'resident', name: 'Jane', identifier: 'jane123', password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects site_admin type (not in enum)', () => {
    const result = createUserSchema.safeParse({
      type: 'site_admin', name: 'Admin', identifier: 'admin', password: 'secret123',
    });
    expect(result.success).toBe(false);
  });
});

describe('createUnitSchema', () => {
  it('accepts valid unit', () => {
    const result = createUnitSchema.safeParse({ unitNumber: '102' });
    expect(result.success).toBe(true);
  });

  it('accepts unit with status', () => {
    const result = createUnitSchema.safeParse({ unitNumber: '103', status: 'occupied' });
    expect(result.success).toBe(true);
  });

  it('rejects empty unitNumber', () => {
    const result = createUnitSchema.safeParse({ unitNumber: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createUnitSchema.safeParse({ unitNumber: '104', status: 'burning' });
    expect(result.success).toBe(false);
  });
});

describe('createCommitteeSchema', () => {
  it('accepts valid committee name', () => {
    const result = createCommitteeSchema.safeParse({ name: 'Finance Committee' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createCommitteeSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createCommitteeHeadSchema', () => {
  it('accepts valid data', () => {
    const result = createCommitteeHeadSchema.safeParse({ name: 'Head', identifier: 'head1', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = createCommitteeHeadSchema.safeParse({ name: 'Head', identifier: 'head1', password: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('createCommitteeMemberSchema', () => {
  it('accepts valid data', () => {
    const result = createCommitteeMemberSchema.safeParse({ name: 'Member', identifier: 'mem1', password: 'secret123' });
    expect(result.success).toBe(true);
  });
});

describe('ledgerEntrySchema', () => {
  it('accepts income entry', () => {
    const result = ledgerEntrySchema.safeParse({ type: 'income', amount: 500, description: 'Donation' });
    expect(result.success).toBe(true);
  });

  it('accepts expense entry', () => {
    const result = ledgerEntrySchema.safeParse({ type: 'expense', amount: 100, description: 'Supplies' });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = ledgerEntrySchema.safeParse({ type: 'income', amount: 0, description: 'Test' });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = ledgerEntrySchema.safeParse({ type: 'income', amount: 100, description: '' });
    expect(result.success).toBe(false);
  });
});

describe('generateBillsSchema', () => {
  it('accepts valid data', () => {
    const result = generateBillsSchema.safeParse({ amount: 500, period: '2026-07', dueDate: '2026-08-01' });
    expect(result.success).toBe(true);
  });
});

describe('createComplaintSchema', () => {
  it('accepts valid complaint', () => {
    const result = createComplaintSchema.safeParse({ committeeId: 'comm123', description: 'Leaking pipe' });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = createComplaintSchema.safeParse({ committeeId: 'comm123', description: '' });
    expect(result.success).toBe(false);
  });
});

describe('updateComplaintSchema', () => {
  it('accepts status update', () => {
    const result = updateComplaintSchema.safeParse({ status: 'resolved' });
    expect(result.success).toBe(true);
  });

  it('accepts rating', () => {
    const result = updateComplaintSchema.safeParse({ rating: 4 });
    expect(result.success).toBe(true);
  });

  it('rejects rating out of range', () => {
    const result = updateComplaintSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects rating too low', () => {
    const result = updateComplaintSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });
});

describe('createVisitorLogSchema', () => {
  it('accepts valid log', () => {
    const result = createVisitorLogSchema.safeParse({ visitorName: 'Bob', purpose: 'Delivery', unitVisited: '101' });
    expect(result.success).toBe(true);
  });
});

describe('createNoticeSchema', () => {
  it('accepts notice with committee', () => {
    const result = createNoticeSchema.safeParse({ committeeId: 'c1', title: 'Meeting', body: 'Tomorrow at 5pm' });
    expect(result.success).toBe(true);
  });

  it('accepts notice without committee (apartment-wide)', () => {
    const result = createNoticeSchema.safeParse({ title: 'Holiday', body: 'Office closed' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createNoticeSchema.safeParse({ title: '', body: 'body' });
    expect(result.success).toBe(false);
  });
});

describe('markInvoicePaidSchema', () => {
  it('accepts paid status', () => {
    const result = markInvoicePaidSchema.safeParse({ status: 'paid' });
    expect(result.success).toBe(true);
  });

  it('rejects unpaid status', () => {
    const result = markInvoicePaidSchema.safeParse({ status: 'unpaid' });
    expect(result.success).toBe(false);
  });
});

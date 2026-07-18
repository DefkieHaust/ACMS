import { z } from 'zod';

export const loginSchema = z.object({
  apartmentName: z.string().optional(),
  type: z.enum(['site_admin', 'apartment_admin', 'committee_head', 'committee_member', 'resident']),
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const createApartmentSchema = z.object({
  name: z.string().min(1).trim().toLowerCase(),
  address: z.string().min(1),
});

export const updateApartmentSchema = z.object({
  address: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  planId: z.string().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  priceType: z.enum(['per-unit', 'flat']),
  price: z.number().positive(),
  features: z.array(z.string()).optional(),
});

export const createUserSchema = z.object({
  apartmentId: z.string().optional(),
  type: z.enum(['apartment_admin', 'committee_head', 'committee_member', 'resident']),
  committeeId: z.string().optional(),
  unitId: z.string().optional(),
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
});

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1),
  residentUserId: z.string().optional(),
  status: z.enum(['occupied', 'vacant']).optional(),
});

export const createCommitteeSchema = z.object({
  name: z.string().min(1),
});

export const createCommitteeHeadSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
});

export const createCommitteeMemberSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
});

export const ledgerEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().optional(),
});

export const generateBillsSchema = z.object({
  amount: z.number().positive(),
  period: z.string().min(1),
  dueDate: z.string().min(1),
  committeeId: z.string().min(1),
});

export const createComplaintSchema = z.object({
  committeeId: z.string().min(1),
  description: z.string().min(1),
});

export const updateComplaintSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  assignedTo: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const createVisitorLogSchema = z.object({
  visitorName: z.string().min(1),
  purpose: z.string().min(1),
  unitVisited: z.string().min(1),
});

export const checkoutVisitorSchema = z.object({
  checkOut: z.string().min(1),
});

export const createNoticeSchema = z.object({
  committeeId: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const markInvoicePaidSchema = z.object({
  status: z.enum(['paid']),
});

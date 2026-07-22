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
  city: z.string().optional().default(''),
  country: z.string().optional().default(''),
  apartmentType: z.string().optional().default(''),
  defaultCurrency: z.string().optional().default('USD'),
});

export const updateApartmentSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  apartmentType: z.string().optional(),
  defaultCurrency: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  planId: z.string().optional().nullable(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  priceType: z.enum(['per-unit', 'flat']),
  price: z.number().positive(),
  currency: z.string().optional().default('USD'),
  features: z.array(z.string()).optional(),
});

export const createUserSchema = z.object({
  apartmentId: z.string().optional(),
  type: z.enum(['apartment_admin', 'committee_head', 'committee_member', 'resident', 'unit_owner']),
  residentType: z.string().optional().nullable(),
  committeeId: z.string().optional(),
  unitId: z.string().optional(),
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
  phone: z.union([z.array(z.string()), z.string()]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : []),
  identityNumber: z.string().optional(),
  residence: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  unitId: z.string().optional().nullable(),
  residentType: z.string().optional().nullable(),
  phone: z.array(z.string()).optional(),
  identityNumber: z.string().optional(),
  residence: z.string().optional(),
  customRole: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1),
  unitType: z.string().optional().default(''),
  residentUserId: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(['occupied', 'vacant']).optional(),
});

export const createCommitteeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
});

export const updateCommitteeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createCommitteeHeadSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
  phone: z.array(z.string()).optional(),
  identityNumber: z.string().optional(),
  residence: z.string().optional(),
});

export const createCommitteeMemberSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  password: z.string().min(6),
  phone: z.array(z.string()).optional(),
  identityNumber: z.string().optional(),
  residence: z.string().optional(),
  customRole: z.string().optional(),
});

export const addCommitteeMemberFromExistingSchema = z.object({
  userId: z.string().min(1),
  customRole: z.string().optional(),
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
  currency: z.string().optional().default('USD'),
});

export const createComplaintSchema = z.object({
  committeeId: z.string().min(1),
  title: z.string().optional(),
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

export const updateUnitSchema = z.object({
  unitNumber: z.string().min(1).optional(),
  unitType: z.string().optional(),
  residentUserId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  status: z.enum(['occupied', 'vacant']).optional(),
});

export const updateApartmentSettingsSchema = z.object({
  defaultCurrency: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  apartmentType: z.string().optional(),
});

export const createCustomRoleSchema = z.object({
  name: z.string().min(1),
});

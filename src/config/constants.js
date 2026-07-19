export const ROLES = {
  SITE_ADMIN: 'site_admin',
  APARTMENT_ADMIN: 'apartment_admin',
  COMMITTEE_HEAD: 'committee_head',
  COMMITTEE_MEMBER: 'committee_member',
  RESIDENT: 'resident',
  UNIT_OWNER: 'unit_owner',
};

export const RESIDENT_TYPE = {
  TENANT: 'tenant',
  OWNER_FAMILY: 'owner_family',
  OWNER: 'owner',
};

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
};

export const BILL_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  OVERDUE: 'overdue',
};

export const APARTMENT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

export const LEDGER_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const PLAN_PRICE_TYPE = {
  PER_UNIT: 'per-unit',
  FLAT: 'flat',
};

export const PLAN_BILLING_CYCLE = {
  MONTHLY: 'monthly',
};

export const CURRENCIES = {
  USD: 'USD', EUR: 'EUR', GBP: 'GBP', NGN: 'NGN',
  KES: 'KES', ZAR: 'ZAR', GHS: 'GHS', TZS: 'TZS',
  UGX: 'UGX', RWF: 'RWF', ETB: 'ETB', MAD: 'MAD',
  EGP: 'EGP', XAF: 'XAF', XOF: 'XOF', AED: 'AED',
  SAR: 'SAR', CNY: 'CNY', INR: 'INR', CAD: 'CAD',
  AUD: 'AUD', BRL: 'BRL', JPY: 'JPY',
};

export const COUNTRY_CURRENCY = {
  us: 'USD', gb: 'GBP', de: 'EUR', fr: 'EUR', it: 'EUR',
  es: 'EUR', nl: 'EUR', be: 'EUR', pt: 'EUR',
  ng: 'NGN', ke: 'KES', za: 'ZAR', gh: 'GHS',
  tz: 'TZS', ug: 'UGX', rw: 'RWF', et: 'ETB',
  ma: 'MAD', eg: 'EGP', cm: 'XAF', ci: 'XOF',
  ae: 'AED', sa: 'SAR', cn: 'CNY', in: 'INR',
  ca: 'CAD', au: 'AUD', br: 'BRL', jp: 'JPY',
};

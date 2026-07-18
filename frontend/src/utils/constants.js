export const ROLES = {
  SITE_ADMIN: 'site_admin',
  APARTMENT_ADMIN: 'apartment_admin',
  COMMITTEE_HEAD: 'committee_head',
  COMMITTEE_MEMBER: 'committee_member',
  RESIDENT: 'resident',
};

export const ROLE_LABELS = {
  site_admin: 'Site Admin',
  apartment_admin: 'Apartment Admin',
  committee_head: 'Committee Head',
  committee_member: 'Committee Member',
  resident: 'Resident',
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

export const NAV_ITEMS = {
  site_admin: [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Apartments', path: '/admin/apartments' },
    { label: 'Plans', path: '/admin/plans' },
    { label: 'SaaS Invoices', path: '/admin/invoices' },
  ],
  apartment_admin: [
    { label: 'Dashboard', path: '/' },
    { label: 'Units', path: '/units' },
    { label: 'Residents', path: '/residents' },
    { label: 'Committees', path: '/committees' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Notices', path: '/notices' },
  ],
  committee_head: [
    { label: 'Dashboard', path: '/' },
    { label: 'Members', path: '/members' },
    { label: 'Ledger', path: '/ledger' },
    { label: 'Bills', path: '/bills' },
    { label: 'Complaints', path: '/complaints' },
    { label: 'Notices', path: '/notices' },
  ],
  committee_member: [
    { label: 'Dashboard', path: '/' },
    { label: 'Visitor Log', path: '/visitors' },
    { label: 'Complaints', path: '/complaints' },
  ],
  resident: [
    { label: 'Dashboard', path: '/' },
    { label: 'My Bills', path: '/bills' },
    { label: 'Complaints', path: '/complaints' },
    { label: 'Notices', path: '/notices' },
  ],
};

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

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'TZS', 'UGX', 'RWF', 'XAF', 'XOF'];

export const APARTMENT_TYPES = ['residential', 'commercial', 'mixed_use'];

export const UNIT_TYPES = ['apartment', 'studio', 'penthouse', 'duplex', 'shop', 'office', 'warehouse'];

export const RESIDENT_TYPES = ['owner', 'tenant', 'family', 'caretaker'];

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
    { label: 'Account Management', path: '/admin/account-management' },
    { label: 'Notifications', path: '/notifications' },
  ],
  apartment_admin: [
    { label: 'Dashboard', path: '/' },
    { label: 'Units', path: '/units' },
    { label: 'Residents', path: '/residents' },
    { label: 'Committees', path: '/committees' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'Documents', path: '/documents' },
    { label: 'Service Requests', path: '/service-requests' },
    { label: 'Invoices', path: '/invoices' },
    { label: 'Notices', path: '/notices' },
    { label: 'My Account', path: '/account' },
    { label: 'Notifications', path: '/notifications' },
  ],
  committee_head: [
    { label: 'Dashboard', path: '/' },
    { label: 'Members', path: '/members' },
    { label: 'Ledger', path: '/ledger' },
    { label: 'Bills', path: '/bills' },
    { label: 'Complaints', path: '/complaints' },
    { label: 'Notices', path: '/notices' },
    { label: 'Documents', path: '/documents' },
    { label: 'My Account', path: '/account' },
    { label: 'Notifications', path: '/notifications' },
  ],
  committee_member: [
    { label: 'Dashboard', path: '/' },
    { label: 'Visitor Log', path: '/visitors' },
    { label: 'Complaints', path: '/complaints' },
    { label: 'Documents', path: '/documents' },
    { label: 'My Account', path: '/account' },
    { label: 'Notifications', path: '/notifications' },
  ],
  resident: [
    { label: 'Dashboard', path: '/' },
    { label: 'My Bills', path: '/bills' },
    { label: 'Complaints', path: '/complaints' },
    { label: 'Notices', path: '/notices' },
    { label: 'Service Requests', path: '/service-requests' },
    { label: 'Book Facility', path: '/bookings' },
    { label: 'Documents', path: '/documents' },
    { label: 'My Account', path: '/account' },
    { label: 'Notifications', path: '/notifications' },
  ],
};

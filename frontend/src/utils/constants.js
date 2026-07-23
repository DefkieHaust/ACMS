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
    { label: 'Dashboard', path: '/admin/dashboard', navKey: 'dashboard' },
    { label: 'Analytics', path: '/admin/analytics', navKey: 'analytics' },
    { label: 'Apartments', path: '/admin/apartments', navKey: 'apartments' },
    { label: 'Plans', path: '/admin/plans', navKey: 'plans' },
    { label: 'SaaS Invoices', path: '/admin/invoices', navKey: 'invoices' },
    { label: 'Account Management', path: '/admin/account-management', navKey: 'accountManagement' },
    { label: 'Audit Logs', path: '/admin/audit-logs', navKey: 'auditLogs' },
    { label: 'Notifications', path: '/notifications', navKey: 'notifications' },
  ],
  apartment_admin: [
    { label: 'Dashboard', path: '/', navKey: 'dashboard' },
    { label: 'Analytics', path: '/admin/apartment-analytics', navKey: 'analytics' },
    { label: 'Units', path: '/units', navKey: 'units' },
    { label: 'Residents', path: '/residents', navKey: 'residents' },
    { label: 'Committees', path: '/committees', navKey: 'committees' },
    { label: 'Facilities', path: '/facilities', navKey: 'facilities' },
    { label: 'Documents', path: '/documents', navKey: 'documents' },
    { label: 'Service Requests', path: '/service-requests', navKey: 'serviceRequests' },
    { label: 'Payment History', path: '/payment-history', navKey: 'invoices' },
    { label: 'Invoices', path: '/invoices', navKey: 'bills' },
    { label: 'Notices', path: '/notices', navKey: 'notices' },
    { label: 'My Account', path: '/account', navKey: 'accountManagement' },
    { label: 'Notifications', path: '/notifications', navKey: 'notifications' },
  ],
  committee_head: [
    { label: 'Dashboard', path: '/', navKey: 'dashboard' },
    { label: 'Members', path: '/members', navKey: 'members' },
    { label: 'Ledger', path: '/ledger', navKey: 'ledger' },
    { label: 'Bills', path: '/bills', navKey: 'bills' },
    { label: 'Complaints', path: '/complaints', navKey: 'complaints' },
    { label: 'Notices', path: '/notices', navKey: 'notices' },
    { label: 'Documents', path: '/documents', navKey: 'documents' },
    { label: 'Payment History', path: '/payment-history', navKey: 'invoices' },
    { label: 'My Account', path: '/account', navKey: 'accountManagement' },
    { label: 'Notifications', path: '/notifications', navKey: 'notifications' },
  ],
  committee_member: [
    { label: 'Dashboard', path: '/', navKey: 'dashboard' },
    { label: 'Visitor Log', path: '/visitors', navKey: 'visitors' },
    { label: 'Complaints', path: '/complaints', navKey: 'complaints' },
    { label: 'Documents', path: '/documents', navKey: 'documents' },
    { label: 'My Account', path: '/account', navKey: 'accountManagement' },
    { label: 'Notifications', path: '/notifications', navKey: 'notifications' },
  ],
  resident: [
    { label: 'Dashboard', path: '/', navKey: 'dashboard' },
    { label: 'My Bills', path: '/bills', navKey: 'bills' },
    { label: 'Complaints', path: '/complaints', navKey: 'complaints' },
    { label: 'Notices', path: '/notices', navKey: 'notices' },
    { label: 'Service Requests', path: '/service-requests', navKey: 'serviceRequests' },
    { label: 'Book Facility', path: '/bookings', navKey: 'facilities' },
    { label: 'Documents', path: '/documents', navKey: 'documents' },
    { label: 'Payment History', path: '/payment-history', navKey: 'invoices' },
    { label: 'My Account', path: '/account', navKey: 'accountManagement' },
    { label: 'Notifications', path: '/notifications', navKey: 'notifications' },
  ],
};

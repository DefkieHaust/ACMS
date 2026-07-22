import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const SiteAdminDashboard = lazy(() => import('./pages/SiteAdminDashboard'));
const ApartmentsPage = lazy(() => import('./pages/ApartmentsPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ApartmentAdminDashboard = lazy(() => import('./pages/ApartmentAdminDashboard'));
const UnitsPage = lazy(() => import('./pages/UnitsPage'));
const ResidentsPage = lazy(() => import('./pages/ResidentsPage'));
const CommitteesPage = lazy(() => import('./pages/CommitteesPage'));
const CommitteeHeadDashboard = lazy(() => import('./pages/CommitteeHeadDashboard'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const BillsPage = lazy(() => import('./pages/BillsPage'));
const ComplaintsPage = lazy(() => import('./pages/ComplaintsPage'));
const VisitorsPage = lazy(() => import('./pages/VisitorsPage'));
const NoticesPage = lazy(() => import('./pages/NoticesPage'));
const ResidentDashboard = lazy(() => import('./pages/ResidentDashboard'));
const AccountManagementPage = lazy(() => import('./pages/AccountManagementPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const FacilitiesPage = lazy(() => import('./pages/FacilitiesPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ServiceRequestsPage = lazy(() => import('./pages/ServiceRequestsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoading() {
  return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.type === 'site_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (user?.type !== 'site_admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!roles.includes(user?.type)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? (user?.type === 'site_admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />) : <Login />} />
        <Route path="/admin/login" element={isAuthenticated ? (user?.type === 'site_admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />) : <AdminLogin />} />

        <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

        <Route path="/units" element={<ProtectedRoute><RoleRoute roles={['apartment_admin']}><UnitsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/residents" element={<ProtectedRoute><RoleRoute roles={['apartment_admin']}><ResidentsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/committees" element={<ProtectedRoute><RoleRoute roles={['apartment_admin']}><CommitteesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><RoleRoute roles={['apartment_admin']}><InvoicesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute><RoleRoute roles={['apartment_admin', 'committee_head', 'resident']}><NoticesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><RoleRoute roles={['committee_head']}><MembersPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/ledger" element={<ProtectedRoute><RoleRoute roles={['committee_head']}><LedgerPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/bills" element={<ProtectedRoute><RoleRoute roles={['committee_head', 'resident']}><BillsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute><RoleRoute roles={['committee_head', 'committee_member', 'resident']}><ComplaintsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/visitors" element={<ProtectedRoute><RoleRoute roles={['committee_member', 'committee_head']}><VisitorsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><RoleRoute roles={['apartment_admin']}><FacilitiesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><RoleRoute roles={['resident']}><BookingsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/service-requests" element={<ProtectedRoute><RoleRoute roles={['apartment_admin', 'resident']}><ServiceRequestsPage /></RoleRoute></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<AdminProtectedRoute><SiteAdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/apartments" element={<AdminProtectedRoute><ApartmentsPage /></AdminProtectedRoute>} />
        <Route path="/admin/plans" element={<AdminProtectedRoute><PlansPage /></AdminProtectedRoute>} />
        <Route path="/admin/invoices" element={<AdminProtectedRoute><InvoicesPage /></AdminProtectedRoute>} />
        <Route path="/admin/account-management" element={<AdminProtectedRoute><AccountManagementPage /></AdminProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.type) {
    case 'apartment_admin': return <ApartmentAdminDashboard />;
    case 'committee_head': return <CommitteeHeadDashboard />;
    case 'committee_member': return <CommitteeHeadDashboard />;
    case 'resident': return <ResidentDashboard />;
    default: return <Navigate to="/login" replace />;
  }
}

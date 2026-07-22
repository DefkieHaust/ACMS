import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import SiteAdminDashboard from './pages/SiteAdminDashboard';
import ApartmentsPage from './pages/ApartmentsPage';
import PlansPage from './pages/PlansPage';
import InvoicesPage from './pages/InvoicesPage';
import ApartmentAdminDashboard from './pages/ApartmentAdminDashboard';
import UnitsPage from './pages/UnitsPage';
import ResidentsPage from './pages/ResidentsPage';
import CommitteesPage from './pages/CommitteesPage';
import CommitteeHeadDashboard from './pages/CommitteeHeadDashboard';
import MembersPage from './pages/MembersPage';
import LedgerPage from './pages/LedgerPage';
import BillsPage from './pages/BillsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import VisitorsPage from './pages/VisitorsPage';
import NoticesPage from './pages/NoticesPage';
import ResidentDashboard from './pages/ResidentDashboard';
import AccountManagementPage from './pages/AccountManagementPage';
import AccountPage from './pages/AccountPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.type === 'site_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
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

      <Route path="/admin/dashboard" element={<AdminProtectedRoute><SiteAdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/apartments" element={<AdminProtectedRoute><ApartmentsPage /></AdminProtectedRoute>} />
      <Route path="/admin/plans" element={<AdminProtectedRoute><PlansPage /></AdminProtectedRoute>} />
      <Route path="/admin/invoices" element={<AdminProtectedRoute><InvoicesPage /></AdminProtectedRoute>} />
      <Route path="/admin/account-management" element={<AdminProtectedRoute><AccountManagementPage /></AdminProtectedRoute>} />
    </Routes>
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

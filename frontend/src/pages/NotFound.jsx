import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const homeLink = user?.type === 'site_admin' ? '/admin/dashboard' : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to={homeLink} className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          Go Home
        </Link>
      </div>
    </div>
  );
}

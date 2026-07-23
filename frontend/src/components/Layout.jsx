import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS, ROLE_LABELS } from '../utils/constants';
import NotificationBell from './NotificationBell';

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch { /* ignore */ }
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch { /* ignore */ }
    }
  }, [dark]);

  useEffect(() => {
    let stored;
    try { stored = localStorage.getItem('theme'); } catch { /* ignore */ }
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_ITEMS[user?.type] || [];

  const handleLogout = () => {
    logout();
    navigate(user?.type === 'site_admin' ? '/admin/login' : '/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                className="sm:hidden mr-2 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="text-xl font-bold text-primary-600">ACMS</Link>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="text-xs bg-transparent border border-gray-600 rounded px-1 py-0.5 text-gray-400"
                aria-label="Language"
              >
                <option value="en">EN</option>
              </select>
              <ThemeToggle />
              <NotificationBell />
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {user?.name}
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 rounded-full text-xs font-medium">
                  {ROLE_LABELS[user?.type]}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 fixed sm:static inset-y-0 left-0 z-20 w-64 bg-gray-900 dark:bg-black transform transition-transform duration-200 ease-in-out overflow-y-auto pt-16 sm:pt-0 transition-colors`}
        >
          <nav className="mt-4 px-2 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

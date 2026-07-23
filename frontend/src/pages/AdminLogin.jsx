import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login({ type: 'site_admin', identifier: form.identifier, password: form.password });
      toast.success(`Welcome, ${userData.name}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern-dark bg-grid opacity-40" />
        <div className="absolute top-1/3 -left-16 w-72 h-72 bg-primary-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-16 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="relative text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 backdrop-blur-sm mb-8 border border-primary-400/20">
            <span className="text-3xl font-display font-bold text-white">A</span>
          </div>
          <h1 className="text-4xl font-display text-white mb-4 leading-tight">
            Site Admin<br />Portal
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Manage apartments, plans, invoices, and platform-wide settings from a single dashboard.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface dark:bg-surface-dark">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-10">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 mb-4 lg:hidden">
              <span className="text-xl font-display font-bold">A</span>
            </span>
            <h1 className="text-2xl font-display text-gray-900 dark:text-white">{t('auth.loginTitle')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('nav.login')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.username')}</label>
              <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="admin" className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t('auth.loggingIn')}
                </span>
              ) : t('auth.loginButton')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Resident or Committee? <span className="font-medium text-primary-600 dark:text-primary-400">{t('nav.login')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

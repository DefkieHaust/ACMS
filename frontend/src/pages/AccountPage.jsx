import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  if (authLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">My Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your profile and change your password</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Identifier</span>
            <p className="font-medium text-gray-900 dark:text-white">{user?.identifier}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Role</span>
            <p className="font-medium text-gray-900 dark:text-white">{ROLE_LABELS[user?.type] || user?.type}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
            <input type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input type="password" required minLength={6} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
            <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <button type="submit" className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">Change Password</button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import Button from '../components/Button';

const CATEGORIES = ['resident', 'apartment_admin', 'committee'];
const CATEGORY_LABELS = { resident: 'Resident', apartment_admin: 'Apartment Admin', committee: 'Committee' };
const COMMITTEE_ROLES = [
  { value: 'committee_head', label: 'Committee Head' },
  { value: 'committee_member', label: 'Committee Member' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('resident');
  const [subType, setSubType] = useState('committee_head');
  const [form, setForm] = useState({ apartmentId: '', identifier: '', password: '' });

  useEffect(() => {
    api.get('/auth/apartments').then((r) => {
      setApartments(r.data);
      if (r.data.length > 0) setForm((f) => ({ ...f, apartmentId: r.data[0]._id }));
    }).catch(() => {});
  }, []);

  const getType = () => category === 'committee' ? subType : category;

  const selectedApt = apartments.find((a) => a._id === form.apartmentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login({ apartmentName: selectedApt?.name || '', type: getType(), identifier: form.identifier, password: form.password });
      toast.success(`Welcome, ${userData.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const identifierLabel = category === 'resident' ? 'Unit Number' : 'Staff ID / Username';
  const identifierPlaceholder = category === 'resident' ? 'e.g. B-204' : 'e.g. jdoe';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">ACMS</h1>
          <p className="text-gray-500 mt-1">Apartment Committee Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          {category === 'committee' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee Role</label>
              <select value={subType} onChange={(e) => setSubType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                {COMMITTEE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
            <select value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {apartments.length === 0 && <option value="">No apartments available</option>}
              {apartments.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{identifierLabel}</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder={identifierPlaceholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>

          <Button type="submit" disabled={loading || apartments.length === 0} variant="primary" size="lg" className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/admin/login" className="text-sm text-gray-400 hover:text-primary-600 underline">Admin login →</Link>
        </div>
      </div>
    </div>
  );
}

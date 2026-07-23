import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; } catch { /* localStorage unavailable */ }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data ?? response.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* ignore */ }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

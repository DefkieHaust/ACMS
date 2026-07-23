import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let savedToken, savedUser;
    try { savedToken = localStorage.getItem('token'); savedUser = localStorage.getItem('user'); } catch { /* localStorage unavailable */ }
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* ignore */ }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { token: newToken, user: userData } = res.data;
    try { localStorage.setItem('token', newToken); localStorage.setItem('user', JSON.stringify(userData)); } catch { /* localStorage unavailable */ }
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch { /* localStorage unavailable */ }
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

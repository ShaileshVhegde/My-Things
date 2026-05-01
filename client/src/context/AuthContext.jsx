import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Decode JWT payload — used only as initial fallback before /me responds
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return decodeToken(token);
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const fetchedRef = useRef(false);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[Auth] /me returned:', res.data);
      setUser(res.data); // always overwrite with fresh data including role
    } catch (err) {
      console.warn('[Auth] /me error:', err.response?.status, err.message);
      if (err.response?.status === 401 || err.response?.status === 404) {
        localStorage.removeItem('token');
        setUser(null);
      }
      // For network errors etc, keep decoded JWT user
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: fetch fresh user data including role from server
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchMe();
    }
  }, [fetchMe]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  }, []);

  const getToken = useCallback(() => localStorage.getItem('token'), []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, getToken, loading, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

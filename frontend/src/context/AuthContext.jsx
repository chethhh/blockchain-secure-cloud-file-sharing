import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [pendingEmail, setPendingEmail] = useState(() => localStorage.getItem('pendingEmail') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token to state & localStorage
  const saveAuthData = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('pendingEmail');
    setPendingEmail('');
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      setPendingEmail(email);
      localStorage.setItem('pendingEmail', email);
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyOtp = async (otp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.verifyOtp({ email: pendingEmail, otp });
      if (res.data.success) {
        saveAuthData(res.data.token, res.data.user);
      }
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'OTP verification failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register({ name, email, password, role });
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingEmail');
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        pendingEmail,
        loading,
        error,
        login,
        verifyOtp,
        register,
        logout,
        updateUserProfile,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempt session restoration from localstorage tokens
    const token = localStorage.getItem('agri_token');
    const savedUser = localStorage.getItem('agri_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse stored credentials");
        localStorage.removeItem('agri_token');
        localStorage.removeItem('agri_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.login({ email, password });
      
      localStorage.setItem('agri_token', response.token);
      localStorage.setItem('agri_user', JSON.stringify(response.user));
      
      setUser(response.user);
      setLoading(false);
      return response.user;
    } catch (err) {
      setError(err.message || 'Login failed.');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.register({ name, email, password, role });
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isFarmer: user?.role === 'farmer',
    isOwner: user?.role === 'owner' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped in AuthProvider');
  }
  return context;
};

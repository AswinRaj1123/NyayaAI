import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_AUTH_API || 'http://localhost:8000';
const UPLOAD_API = process.env.REACT_APP_UPLOAD_API || 'http://localhost:8001';
const QUERY_API = process.env.REACT_APP_QUERY_API || 'http://localhost:8003';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user info
      axios.get(`${API_BASE}/me`).then(res => setUser(res.data)).catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/login`, new URLSearchParams({
      username: email,
      password
    }));
    const newToken = res.data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const register = async (email, password, full_name) => {
    await axios.post(`${API_BASE}/register`, { email, password, full_name });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, API_BASE, UPLOAD_API, QUERY_API }}>
      {children}
    </AuthContext.Provider>
  );
};
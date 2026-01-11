import { useState, useEffect } from 'react';
import { useLocalStorage } from './index';
import apiClient from '../services/apiClient';
import { STORAGE_KEYS } from '../constants';

/**
 * Custom hook for authentication
 * @returns {object} Auth state and methods
 */
const useAuth = () => {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.USER, null);
  const [token, setToken] = useLocalStorage(STORAGE_KEYS.TOKEN, null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.status === 'success') {
        setToken(response.token);
        // Map backend user fields to frontend format
        const user = {
          id: response.user._id || response.user.id,
          email: response.user.email,
          name: response.user.fullName || response.user.name,
          role: response.user.role,
          phone: response.user.phone,
        };
        setUser(user);
        return { token: response.token, user };
      }
      throw new Error(response.message || 'Đăng nhập thất bại');
    } catch (err) {
      const errorMessage = err.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    // Optional: call backend logout endpoint if available
    // apiClient.post('/auth/logout').catch(() => {});
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role || 'STUDENT',
      });
      if (response.status === 'success') {
        // Optionally auto-login after registration
        // setToken(response.token);
        // setUser(response.user);
        return { success: true, data: response };
      }
      throw new Error(response.message || 'Đăng ký thất bại');
    } catch (err) {
      const errorMessage = err.message || 'Đăng ký thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get current user profile
  const getProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/auth/profile');
      if (response.status === 'success') {
        const userData = response.data || response;
        const user = {
          id: userData._id || userData.id,
          email: userData.email,
          name: userData.fullName || userData.name,
          role: userData.role,
          phone: userData.phone,
        };
        setUser(user);
        return user;
      }
      throw new Error(response.message || 'Lấy thông tin thất bại');
    } catch (err) {
      const errorMessage = err.message || 'Lấy thông tin thất bại';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    getProfile,
  };
};

export default useAuth;


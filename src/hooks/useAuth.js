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
      // Cần call đến BE
      // const response = await apiClient.post('/auth/login', credentials);
      // setToken(response.token);
      // setUser(response.user);
      // return response;
      
      // Mock for now
      const mockResponse = {
        token: 'mock-token',
        user: {
          id: '1',
          email: credentials.email,
          name: 'User',
          role: 'STUDENT',
        },
      };
      setToken(mockResponse.token);
      setUser(mockResponse.user);
      return mockResponse;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    // Cần call đến BE
    // apiClient.post('/auth/logout');
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Cần call đến BE
      // const response = await apiClient.post('/auth/register', userData);
      // return response;
      
      // Mock for now
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current user profile
  const getProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cần call đến BE
      // const response = await apiClient.get('/users/profile');
      // setUser(response);
      // return response;
      
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
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


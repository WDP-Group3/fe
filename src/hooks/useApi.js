import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - Async function that calls the API
 * @param {boolean} immediate - Whether to call the API immediately
 * @returns {object} { data, loading, error, execute }
 */
const useApi = (apiFunction, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { data, loading, error, execute };
};

export default useApi;


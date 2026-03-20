// Đây là phần để gọi những api cụ thể và dùng lại ở nhiều nơi

// API Client configuration using Fetch API
import config from '../config';

const API_BASE_URL = config.apiBaseUrl || 'http://localhost:3000/api';

// Helper function to get headers with auth token
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  let token = localStorage.getItem('token');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (typeof parsed === 'string') {
        token = parsed;
      }
    } catch {
      // token đã là string
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// API Client methods
const apiClient = {
  get: async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
      ...options,
    });

    const data = await response.json();

    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      console.error('Response data:', data);

      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Chỉ redirect nếu không phải đang ở trang login/register
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Delay redirect để có thời gian hiển thị error message
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000); // Tăng từ 100ms lên 2000ms để user có thời gian đọc error
      }
      throw new Error(data.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  post: async (url, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });

    const responseData = await response.json();

    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      console.error('Response data:', responseData);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      throw new Error(responseData.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  },

  put: async (url, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });

    const responseData = await response.json();

    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      console.error('Response data:', responseData);

      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Chỉ redirect nếu không phải đang ở trang login/register
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Delay redirect để có thời gian hiển thị error message
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000); // Tăng từ 100ms lên 2000ms để user có thời gian đọc error
      }
      throw new Error(responseData.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  },

  patch: async (url, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });

    const responseData = await response.json();

    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      console.error('Response data:', responseData);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      throw new Error(responseData.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  },

  delete: async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
      ...options,
    });

    const responseData = await response.json();

    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      console.error('Response data:', responseData);

      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Chỉ redirect nếu không phải đang ở trang login/register
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Delay redirect để có thời gian hiển thị error message
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000); // Tăng từ 100ms lên 2000ms để user có thời gian đọc error
      }
      throw new Error(responseData.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return responseData;
  },
};

export default apiClient;

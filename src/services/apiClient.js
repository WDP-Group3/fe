// API Client using Fetch API
import config from '../config';

const API_BASE_URL = config.apiBaseUrl || 'http://localhost:3000/api';

/**
 * Lay token tu localStorage, ho tro ca 2 truong hop:
 * - Token duoc luu truc tiep (string)
 * - Token duoc luu qua useLocalStorage (JSON.stringify)
 */
const getToken = () => {
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Neu parsed la string thi day la token
    // Neu parsed la object thi thu lay property chua token
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'object' && parsed !== null) return parsed.value || parsed.token || raw;
    return raw;
  } catch {
    // JSON.parse that bai = day la plain string (JWT thuan)
    return raw;
  }
};

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
    throw new Error(data.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

const apiClient = {
  get: async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
      ...options,
    });
    return handleResponse(response);
  },

  post: async (url, data, options = {}) => {
    const isMultipart = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? data : JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  put: async (url, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  patch: async (url, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  delete: async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
      ...options,
    });
    return handleResponse(response);
  },
};

export default apiClient;

import axios from 'axios';
import config from '../config';

// Tạo axios instance với cấu hình cơ bản
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl || 'http://localhost:3000/api',
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header trước khi gửi request
axiosInstance.interceptors.request.use(
  (configReq) => {
    let token = localStorage.getItem('token');

    // Nếu token được lưu dạng JSON string (do useLocalStorage), parse ra
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (typeof parsed === 'string') {
          token = parsed;
        }
      } catch {
        // token đã là string, bỏ qua
      }
    }

    if (token) {
      configReq.headers.Authorization = `Bearer ${token}`;
    }

    return configReq;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý response và error
axiosInstance.interceptors.response.use(
  (response) => {
    // Trả về data trực tiếp từ response
    return response.data;
  },
  (error) => {
    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Chỉ redirect nếu không phải trang login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Trả về error với thông tin chi tiết
    return Promise.reject(error.response?.data || error.message || 'Có lỗi xảy ra');
  }
);

export default axiosInstance;


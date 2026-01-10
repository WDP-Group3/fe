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

// // Request interceptor - Thêm token vào header trước khi gửi request
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Response interceptor - Xử lý response và error
axiosInstance.interceptors.response.use(
  (response) => {
    // Trả về data trực tiếp từ response
    console.log(123)
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


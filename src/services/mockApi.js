// Mock API Service - Simulate backend API calls
import { USER_ROLES, ENROLLMENT_STATUS, PAYMENT_STATUS } from '../constants';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (simulate database)
let mockUsers = [
  {
    id: '1',
    email: 'student@example.com',
    name: 'Nguyễn Văn A',
    phone: '0912345678',
    role: USER_ROLES.STUDENT,
    avatar: null,
  },
  {
    id: '2',
    email: 'staff@example.com',
    name: 'Trần Thị B',
    phone: '0912345679',
    role: USER_ROLES.STAFF,
    avatar: null,
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: 'Lê Văn C',
    phone: '0912345680',
    role: USER_ROLES.ADMIN,
    avatar: null,
  },
];

let mockCourses = [
  {
    id: 'A1',
    name: 'Bằng lái xe máy A1',
    price: 2000000,
    duration: '1 tháng',
    startDates: ['15/01', '01/02'],
    installments: ['Đợt 1: 1.000.000đ', 'Đợt 2: 1.000.000đ'],
    perks: ['Thi thử không giới hạn', 'Hỗ trợ hồ sơ'],
  },
];

let mockEnrollments = [];
let mockPayments = [];
let mockSchedules = [];
let mockExams = [];

export const mockApi = {
  // Auth
  async login(credentials) {
    await delay(800);
    const user = mockUsers.find(u => u.email === credentials.email);
    if (!user || credentials.password !== '123456') {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    return {
      token: `mock-token-${user.id}`,
      user,
    };
  },

  async register(userData) {
    await delay(1000);
    const newUser = {
      id: String(mockUsers.length + 1),
      ...userData,
      role: userData.role || USER_ROLES.STUDENT,
    };
    mockUsers.push(newUser);
    return { success: true, user: newUser };
  },

  async forgotPassword(email) {
    await delay(800);
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('Email không tồn tại');
    }
    return { success: true, message: 'Email đã được gửi' };
  },

  // Users
  async getUserProfile(userId) {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  async updateUserProfile(userId, data) {
    await delay(800);
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  },

  // Courses
  async getCourses() {
    await delay(500);
    return mockCourses;
  },

  async getCourse(id) {
    await delay(300);
    return mockCourses.find(c => c.id === id);
  },

  // Enrollment
  async getEnrollments(userId) {
    await delay(500);
    return mockEnrollments.filter(e => !userId || e.studentId === userId);
  },

  async createEnrollment(data) {
    await delay(1000);
    const enrollment = {
      id: String(mockEnrollments.length + 1),
      ...data,
      status: ENROLLMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    };
    mockEnrollments.push(enrollment);
    return enrollment;
  },

  async updateEnrollment(id, data) {
    await delay(800);
    const index = mockEnrollments.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Enrollment not found');
    mockEnrollments[index] = { ...mockEnrollments[index], ...data };
    return mockEnrollments[index];
  },

  // Payments
  async getPayments(userId) {
    await delay(500);
    return mockPayments.filter(p => !userId || p.userId === userId);
  },

  async createPayment(data) {
    await delay(1000);
    const payment = {
      id: String(mockPayments.length + 1),
      ...data,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    };
    mockPayments.push(payment);
    return payment;
  },

  // Schedule
  async getSchedules(filters = {}) {
    await delay(500);
    let schedules = [...mockSchedules];
    if (filters.userId) {
      schedules = schedules.filter(s => s.userId === filters.userId);
    }
    if (filters.date) {
      schedules = schedules.filter(s => s.date === filters.date);
    }
    return schedules;
  },

  async bookSchedule(data) {
    await delay(1000);
    const schedule = {
      id: String(mockSchedules.length + 1),
      ...data,
      status: 'booked',
      createdAt: new Date().toISOString(),
    };
    mockSchedules.push(schedule);
    return schedule;
  },

  async cancelSchedule(id) {
    await delay(800);
    const index = mockSchedules.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Schedule not found');
    mockSchedules[index].status = 'cancelled';
    return mockSchedules[index];
  },

  // Exams
  async getExamHistory(userId) {
    await delay(500);
    return mockExams.filter(e => e.userId === userId);
  },

  async startExam(userId) {
    await delay(500);
    // Mock 600 questions
    const questions = Array.from({ length: 600 }, (_, i) => ({
      id: i + 1,
      question: `Câu hỏi ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
    }));
    return { examId: `exam-${Date.now()}`, questions };
  },

  async submitExam(examId, answers) {
    await delay(1000);
    const exam = {
      id: examId,
      answers,
      score: Math.floor(Math.random() * 30) + 70,
      completedAt: new Date().toISOString(),
    };
    mockExams.push(exam);
    return exam;
  },
};

export default mockApi;

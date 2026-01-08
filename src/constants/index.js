// Application constants

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
  COURSES: {
    BASE: '/courses',
    LIST: '/courses',
    DETAIL: '/courses/:id',
    CREATE: '/courses',
    UPDATE: '/courses/:id',
    DELETE: '/courses/:id',
  },
  ENROLLMENT: {
    BASE: '/enrollment',
    LIST: '/enrollment',
    DETAIL: '/enrollment/:id',
    CREATE: '/enrollment',
    UPDATE: '/enrollment/:id',
    APPROVE: '/enrollment/:id/approve',
    SUBMIT: '/enrollment/:id/submit',
  },
  PAYMENTS: {
    BASE: '/payments',
    LIST: '/payments',
    CREATE: '/payments',
    UPDATE: '/payments/:id',
    REMIND: '/payments/remind',
  },
  SCHEDULE: {
    BASE: '/schedule',
    LIST: '/schedule',
    BOOK: '/schedule/book',
    CANCEL: '/schedule/:id/cancel',
    ATTENDANCE: '/schedule/:id/attendance',
  },
  EXAMS: {
    BASE: '/exams',
    QUESTIONS: '/exams/questions',
    START: '/exams/start',
    SUBMIT: '/exams/:id/submit',
    HISTORY: '/exams/history',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    SETTINGS: '/notifications/settings',
  },
  ADMIN: {
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    CONFIG: '/admin/config',
    REPORTS: '/admin/reports',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Routes
export const ROUTES = {
  HOME: '/',
  PORTAL: '/portal',
  PORTAL_OVERVIEW: '/portal/overview',
  PORTAL_COURSES: '/portal/courses',
  PORTAL_ENROLLMENT: '/portal/enrollment',
  PORTAL_PAYMENTS: '/portal/payments',
  PORTAL_SCHEDULE: '/portal/schedule',
  PORTAL_EXAMS: '/portal/exams',
  PORTAL_NOTIFICATIONS: '/portal/notifications',
  PORTAL_ADMIN: '/portal/admin',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
};

// User Roles
export const USER_ROLES = {
  GUEST: 'GUEST',
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  SALE: 'SALE',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
};

// Enrollment Status
export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUBMITTED: 'submitted',
  WAITING_EXAM: 'waiting_exam',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

// Course Types
export const COURSE_TYPES = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CARD: 'card',
};

// Validation Rules
export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 11,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  APP: 'APP',
  ALL: 'ALL',
};


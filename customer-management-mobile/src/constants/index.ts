/**
 * App Constants
 * Centralized location for all app-wide constants
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Event Categories
export const EVENT_CATEGORIES = {
  SELF_EVENT: 'self_event',
  CUSTOMER_EVENT: 'customer_event',
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD MMM YYYY HH:mm',
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  MOBILE_NUMBER: /^[0-9]{10}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// API Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  CUSTOMER_CREATED: 'Customer created successfully',
  CUSTOMER_UPDATED: 'Customer updated successfully',
  CUSTOMER_DELETED: 'Customer deleted successfully',
  GIFT_CREATED: 'Gift created successfully',
  GIFT_UPDATED: 'Gift updated successfully',
  GIFT_DELETED: 'Gift deleted successfully',
  ADMIN_CREATED: 'Admin created successfully',
  ADMIN_UPDATED: 'Admin updated successfully',
  ADMIN_DELETED: 'Admin deleted successfully',
} as const;

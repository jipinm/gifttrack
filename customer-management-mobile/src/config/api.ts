/**
 * API Configuration
 * Defines all API endpoints and configuration for the Customer Management API
 */
import Constants from 'expo-constants';

// Get API URL from app config (loaded from .env via app.config.js)
const getApiBaseUrl = (): string => {
  // First try to get from expo-constants extra config
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configUrl) {
    return configUrl;
  }
  
  // Fallback to default production URL
  return 'https://gift-track.myprojectdemo.live';
};

// API Base URL Configuration
export const API_CONFIG = {
  // Base URL is loaded from .env file via app.config.js
  BASE_URL: getApiBaseUrl(),

  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints following RESTful design
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // Customers
  CUSTOMERS: {
    BASE: '/api/customers',
    SHOW: '/api/customers/show',
    EVENTS: '/api/customers/events',
  },

  // Events (Standalone - managed by Super Admin)
  EVENTS: {
    BASE: '/api/events',
    SHOW: '/api/events/show',
    UPDATE: '/api/events/update',
    DELETE: '/api/events/delete',
    // Event-Customer attachments
    CUSTOMERS: '/api/events/customers',
    UPDATE_ATTACHMENT: '/api/events/update-attachment',
    DETACH_CUSTOMER: '/api/events/detach-customer',
  },

  // Gifts
  GIFTS: {
    BASE: '/api/gifts',
    UPDATE: '/api/gifts/update',
    DELETE: '/api/gifts/delete',
    CUSTOMER_GIFTS: '/api/gifts/customer-gifts',
  },

  // Admins (Superadmin only)
  ADMINS: {
    BASE: '/api/admins',
    INDEX: '/api/admins/index',
    SHOW: '/api/admins/show',
    CREATE: '/api/admins/create',
    UPDATE: '/api/admins/update',
    DELETE: '/api/admins/delete',
  },

  // Master Data
  MASTER_DATA: {
    STATES: '/api/master/states',
    DISTRICTS: '/api/master/districts',
    CITIES: '/api/master/cities',
    EVENT_TYPES: '/api/master/event-types',
    GIFT_TYPES: '/api/master/gift-types',
    INVITATION_STATUS: '/api/master/invitation-status',
    CARE_OF_OPTIONS: '/api/master/care-of-options',
  },
};

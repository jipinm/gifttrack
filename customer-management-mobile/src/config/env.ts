/**
 * Environment Configuration
 * Centralized configuration for API endpoints and app settings
 */

// Determine if we're in development or production
const isDevelopment = __DEV__;

// App Configuration
export const APP_CONFIG = {
  // App Name
  NAME: 'Gifts Track',

  // App Version
  VERSION: '1.0.0',

  // Enable debug mode
  DEBUG: isDevelopment,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  USER_ROLE: 'user_role',
  MASTER_DATA_CACHE: 'master_data_cache',
  THEME_PREFERENCE: 'theme_preference',
};

// Cache Configuration
export const CACHE_CONFIG = {
  // Master data cache TTL (24 hours in milliseconds)
  MASTER_DATA_TTL: 24 * 60 * 60 * 1000,

  // Customer list cache TTL (5 minutes)
  CUSTOMER_LIST_TTL: 5 * 60 * 1000,
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Validation Rules
export const VALIDATION_RULES = {
  MOBILE_NUMBER_LENGTH: 10,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
};

export default {
  APP_CONFIG,
  STORAGE_KEYS,
  CACHE_CONFIG,
  PAGINATION_CONFIG,
  VALIDATION_RULES,
};

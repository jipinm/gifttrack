/**
 * Utils Index
 * Central export for all utility functions
 */

// Validation utilities
export {
  validateMobileNumber,
  validatePassword,
  validateRequired,
  validateDate,
  validatePositiveNumber,
  validateEmail,
  validateLength,
  validateName,
  combineValidations,
} from './validation';

export type { ValidationResult } from './validation';

// Formatting utilities
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMobileNumber,
  formatMobileForCall,
  truncateText,
  capitalizeWords,
  formatAbbreviatedNumber,
  formatPercentage,
  getInitials,
  formatFileSize,
} from './format';

// Helper functions
export {
  debounce,
  throttle,
  isAdmin,
  isSuperAdmin,
  handleApiError,
  createQueryString,
  parseQueryString,
  deepClone,
  deepEqual,
  generateId,
  sleep,
  retry,
  groupBy,
  sortBy,
  unique,
  isEmpty,
  pick,
  omit,
} from './helpers';

export type { ApiError } from './helpers';

// Storage utilities
export { storage, secureStorage, cacheStorage, requestQueue } from './storage';

export type { CacheItem, StorageOptions, QueuedRequest } from './storage';

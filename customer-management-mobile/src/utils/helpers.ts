/**
 * Helper Functions
 * General utility functions
 */

import { User } from '../types';

/**
 * Debounce function
 * Delays function execution until after wait milliseconds have elapsed
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function
 * Limits function execution to once per specified interval
 * @param fn - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if user is an admin
 * @param user - User object
 * @returns Whether user is an admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'superadmin';
}

/**
 * Check if user is a superadmin
 * @param user - User object
 * @returns Whether user is a superadmin
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'superadmin';
}

/**
 * API Error interface
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string>;
}

/**
 * Handle API error and return standardized error object
 * @param error - Error from API call
 * @returns Standardized ApiError object
 */
export function handleApiError(error: unknown): ApiError {
  // Network error
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return {
      status: 0,
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  // Axios-style error with response
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object'
  ) {
    const response = (
      error as { response: { status?: number; data?: { message?: string; error?: string } } }
    ).response;
    const status = response?.status ?? 500;
    const data = response?.data;

    return {
      status,
      message: data?.message ?? data?.error ?? getDefaultErrorMessage(status),
      code: `HTTP_${status}`,
    };
  }

  // Error with message property
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      status: 500,
      message: error,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Fallback
  return {
    status: 500,
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get default error message for HTTP status code
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This record already exists.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Create query string from object
 * @param params - Object with query parameters
 * @returns URL query string
 */
export function createQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse query string to object
 * @param queryString - URL query string
 * @returns Object with query parameters
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString.replace(/^\?/, ''));

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  const cloned = {} as T;
  Object.keys(obj as object).forEach((key) => {
    (cloned as Record<string, unknown>)[key] = deepClone((obj as Record<string, unknown>)[key]);
  });

  return cloned;
}

/**
 * Check if two values are deeply equal
 * @param a - First value
 * @param b - Second value
 * @returns Whether values are equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

/**
 * Generate unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep for specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Result of function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Group array items by key
 * @param array - Array to group
 * @param keyFn - Function to get group key
 * @returns Grouped object
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Sort array by key
 * @param array - Array to sort
 * @param keyFn - Function to get sort key
 * @param order - Sort order
 * @returns Sorted array
 */
export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => string | number | Date,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...array].sort((a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  return order === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Remove duplicates from array
 * @param array - Array with potential duplicates
 * @param keyFn - Function to get unique key (optional)
 * @returns Array without duplicates
 */
export function unique<T>(array: T[], keyFn?: (item: T) => string | number): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set<string | number>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns Whether value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Pick specific keys from object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only specified keys
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns Object without specified keys
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * Storage Utility
 * Centralized local storage operations with AsyncStorage and SecureStore
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
}

/**
 * Secure Storage (for sensitive data like tokens)
 */
export const secureStorage = {
  /**
   * Get a value from secure storage
   */
  get: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in secure storage
   */
  set: async (key: string, value: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`SecureStorage set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove a value from secure storage
   */
  remove: async (key: string): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`SecureStorage remove error for key ${key}:`, error);
      return false;
    }
  },
};

/**
 * Async Storage (for general app data)
 */
export const storage = {
  /**
   * Get a raw value from storage
   */
  getRaw: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Get a parsed JSON value from storage
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in storage (will be JSON stringified)
   */
  set: async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Set a raw string value in storage
   */
  setRaw: async (key: string, value: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   */
  remove: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove multiple values from storage
   */
  multiRemove: async (keys: string[]): Promise<boolean> => {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Storage multiRemove error:', error);
      return false;
    }
  },

  /**
   * Clear all storage
   */
  clear: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  /**
   * Get all keys in storage
   */
  getAllKeys: async (): Promise<readonly string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};

/**
 * Cache Storage (for data with expiration)
 */
export const cacheStorage = {
  /**
   * Get a cached value if not expired
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      const cached: CacheItem<T> = JSON.parse(value);
      const now = Date.now();

      // Check if cache is expired
      if (now > cached.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error(`CacheStorage get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a cached value with TTL
   */
  set: async <T>(key: string, data: T, options: StorageOptions = {}): Promise<boolean> => {
    try {
      const ttl = options.ttl || 24 * 60 * 60 * 1000; // Default 24 hours
      const now = Date.now();

      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.error(`CacheStorage set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Check if a cached value exists and is valid
   */
  isValid: async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return false;

      const cached = JSON.parse(value) as CacheItem<unknown>;
      return Date.now() < cached.expiresAt;
    } catch {
      return false;
    }
  },

  /**
   * Get cache metadata (timestamp, expiration)
   */
  getMeta: async (
    key: string
  ): Promise<{ timestamp: number; expiresAt: number; isExpired: boolean } | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      const cached = JSON.parse(value) as CacheItem<unknown>;
      const now = Date.now();

      return {
        timestamp: cached.timestamp,
        expiresAt: cached.expiresAt,
        isExpired: now > cached.expiresAt,
      };
    } catch {
      return null;
    }
  },

  /**
   * Invalidate (remove) a cached value
   */
  invalidate: async (key: string): Promise<boolean> => {
    return storage.remove(key);
  },

  /**
   * Invalidate all cached values matching a prefix
   */
  invalidateByPrefix: async (prefix: string): Promise<boolean> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter((key) => key.startsWith(prefix));

      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
      }

      return true;
    } catch (error) {
      console.error('CacheStorage invalidateByPrefix error:', error);
      return false;
    }
  },
};

/**
 * Request Queue for offline support
 */
interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  timestamp: number;
  retryCount: number;
}

const REQUEST_QUEUE_KEY = '@request_queue';

export const requestQueue = {
  /**
   * Add a request to the queue
   */
  add: async (
    request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<boolean> => {
    try {
      const queue = await requestQueue.getAll();
      const newRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(newRequest);
      await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('RequestQueue add error:', error);
      return false;
    }
  },

  /**
   * Get all queued requests
   */
  getAll: async (): Promise<QueuedRequest[]> => {
    try {
      const value = await AsyncStorage.getItem(REQUEST_QUEUE_KEY);
      if (value) {
        return JSON.parse(value) as QueuedRequest[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Remove a request from the queue
   */
  remove: async (id: string): Promise<boolean> => {
    try {
      const queue = await requestQueue.getAll();
      const filtered = queue.filter((req) => req.id !== id);
      await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('RequestQueue remove error:', error);
      return false;
    }
  },

  /**
   * Update retry count for a request
   */
  incrementRetry: async (id: string): Promise<boolean> => {
    try {
      const queue = await requestQueue.getAll();
      const updated = queue.map((req) =>
        req.id === id ? { ...req, retryCount: req.retryCount + 1 } : req
      );
      await AsyncStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('RequestQueue incrementRetry error:', error);
      return false;
    }
  },

  /**
   * Clear all queued requests
   */
  clear: async (): Promise<boolean> => {
    return storage.remove(REQUEST_QUEUE_KEY);
  },

  /**
   * Get queue size
   */
  size: async (): Promise<number> => {
    const queue = await requestQueue.getAll();
    return queue.length;
  },
};

// ============================================================================
// Security Functions - Clear Sensitive Data
// ============================================================================

/**
 * Keys that contain sensitive data (should be cleared on logout)
 */
const SENSITIVE_KEYS = [
  'auth_token',
  'user_data',
  'user_role',
  'request_queue',
  // Add any other sensitive keys here
];

/**
 * Keys that can persist after logout (user preferences)
 */
const PERSISTENT_KEYS = [
  'theme_preference',
  'language_preference',
  'onboarding_complete',
];

/**
 * Clear all sensitive security data
 * Called on logout to ensure no sensitive data remains
 */
export const clearAllSensitiveData = async (): Promise<boolean> => {
  try {
    // Clear secure storage (tokens, user data)
    await secureStorage.remove('auth_token');
    await secureStorage.remove('user_data');
    await secureStorage.remove('user_role');

    // Clear all cached data from AsyncStorage except persistent keys
    const allKeys = await storage.getAllKeys();
    const keysToRemove = allKeys.filter(
      (key) => !PERSISTENT_KEYS.some((pk) => key.includes(pk))
    );

    if (keysToRemove.length > 0) {
      await storage.multiRemove([...keysToRemove]);
    }

    // Clear request queue
    await requestQueue.clear();

    console.log('All sensitive data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing sensitive data:', error);
    return false;
  }
};

/**
 * Clear only authentication data (for re-login scenarios)
 */
export const clearAuthData = async (): Promise<boolean> => {
  try {
    await secureStorage.remove('auth_token');
    await secureStorage.remove('user_data');
    await secureStorage.remove('user_role');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Clear all cached data (master data, customer data, etc.)
 */
export const clearCachedData = async (): Promise<boolean> => {
  try {
    const allKeys = await storage.getAllKeys();
    const cacheKeys = allKeys.filter(
      (key) =>
        key.includes('cache') ||
        key.includes('master_data') ||
        key.includes('customer') ||
        key.includes('gift')
    );

    if (cacheKeys.length > 0) {
      await storage.multiRemove([...cacheKeys]);
    }

    return true;
  } catch (error) {
    console.error('Error clearing cached data:', error);
    return false;
  }
};

export type { CacheItem, StorageOptions, QueuedRequest };

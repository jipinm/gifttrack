/**
 * useOfflineAware Hook
 * Provides offline-aware data fetching with caching
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { cacheStorage } from '../utils/storage';
import { useNetwork } from '../context/NetworkContext';

interface UseOfflineAwareOptions<T> {
  cacheKey: string;
  cacheTTL?: number; // in milliseconds
  fetchFn: () => Promise<T>;
  onError?: (error: Error) => void;
  autoFetch?: boolean;
}

interface UseOfflineAwareResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  isCacheValid: boolean;
  fetch: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  clearCache: () => Promise<void>;
}

export function useOfflineAware<T>({
  cacheKey,
  cacheTTL = 24 * 60 * 60 * 1000, // 24 hours default
  fetchFn,
  onError,
  autoFetch = true,
}: UseOfflineAwareOptions<T>): UseOfflineAwareResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isCacheValid, setIsCacheValid] = useState(false);
  const { isConnected } = useNetwork();
  const hasFetched = useRef(false);

  /**
   * Load data from cache
   */
  const loadFromCache = useCallback(async (): Promise<T | null> => {
    try {
      const cachedData = await cacheStorage.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
        setIsCacheValid(true);
        return cachedData;
      }
    } catch (err) {
      console.error('Failed to load from cache:', err);
    }
    return null;
  }, [cacheKey]);

  /**
   * Fetch data from API and cache it
   */
  const fetch = useCallback(async (): Promise<T | null> => {
    // If offline, try to load from cache
    if (!isConnected) {
      const cached = await loadFromCache();
      if (!cached) {
        setError('You are offline and no cached data is available');
      }
      return cached;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchFn();

      setData(result);
      setIsFromCache(false);
      setIsCacheValid(true);

      // Cache the result
      await cacheStorage.set(cacheKey, result, { ttl: cacheTTL });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      // Try to fall back to cache
      const cached = await loadFromCache();
      return cached;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchFn, cacheKey, cacheTTL, loadFromCache, onError]);

  /**
   * Force refresh (clear cache and fetch)
   */
  const refresh = useCallback(async (): Promise<T | null> => {
    await cacheStorage.invalidate(cacheKey);
    setIsCacheValid(false);
    return fetch();
  }, [cacheKey, fetch]);

  /**
   * Clear the cache
   */
  const clearCache = useCallback(async (): Promise<void> => {
    await cacheStorage.invalidate(cacheKey);
    setIsCacheValid(false);
  }, [cacheKey]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      // Try cache first, then fetch
      loadFromCache().then((cached) => {
        if (!cached || isConnected) {
          fetch();
        }
      });
    }
  }, [autoFetch, loadFromCache, fetch, isConnected]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    isCacheValid,
    fetch,
    refresh,
    clearCache,
  };
}

export default useOfflineAware;

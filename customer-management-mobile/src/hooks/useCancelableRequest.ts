/**
 * useCancelableRequest Hook
 * Makes API requests that can be canceled on component unmount
 * Prevents memory leaks and state updates on unmounted components
 */
import { useRef, useCallback, useEffect } from 'react';
import axios, { CancelTokenSource } from 'axios';

interface CancelableRequestResult<T> {
  execute: (requestFn: (cancelToken: CancelTokenSource) => Promise<T>) => Promise<T | null>;
  cancel: () => void;
  isCanceled: () => boolean;
}

/**
 * Hook for making cancelable API requests
 * Automatically cancels pending requests on unmount
 */
export function useCancelableRequest<T = unknown>(): CancelableRequestResult<T> {
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  /**
   * Execute a request that can be canceled
   */
  const execute = useCallback(
    async (requestFn: (cancelToken: CancelTokenSource) => Promise<T>): Promise<T | null> => {
      // Cancel any existing request
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('New request started');
      }

      // Create new cancel token
      cancelTokenRef.current = axios.CancelToken.source();

      try {
        const result = await requestFn(cancelTokenRef.current);

        // Only return result if still mounted
        if (isMountedRef.current) {
          return result;
        }
        return null;
      } catch (error) {
        if (axios.isCancel(error)) {
          // Request was canceled, ignore
          return null;
        }
        throw error;
      }
    },
    []
  );

  /**
   * Manually cancel the current request
   */
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Request manually canceled');
      cancelTokenRef.current = null;
    }
  }, []);

  /**
   * Check if the current request was canceled
   */
  const isCanceled = useCallback(() => {
    return !isMountedRef.current;
  }, []);

  return { execute, cancel, isCanceled };
}

export default useCancelableRequest;

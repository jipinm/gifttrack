/**
 * useIsMounted Hook
 * Tracks whether a component is mounted to prevent state updates on unmounted components
 */
import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook that returns a function to check if component is still mounted
 * Useful for async operations that might complete after component unmounts
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

export default useIsMounted;

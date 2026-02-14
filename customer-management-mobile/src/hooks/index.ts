/**
 * Hooks Index
 * Central export for all custom hooks
 */

export { useOfflineAware } from './useOfflineAware';
export type { default as UseOfflineAwareResult } from './useOfflineAware';

export { useDebounce } from './useDebounce';

export { useCancelableRequest } from './useCancelableRequest';

export { usePagination } from './usePagination';
export type { PaginationState, UsePaginationOptions, UsePaginationResult } from './usePagination';

export { useIsMounted } from './useIsMounted';

// Security & Permission Hooks
export {
  usePermissions,
  useTokenExpiration,
  useSecureAction,
  useAccessDenied,
} from './usePermissions';

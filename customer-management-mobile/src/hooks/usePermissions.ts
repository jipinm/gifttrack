/**
 * Permission and Security Hooks
 * Hooks for role-based access control and permission validation
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isTokenExpired, getTimeUntilExpiry } from '../utils/security';
import type { UserRole } from '../types';

/**
 * Hook to check user permissions and roles
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  /**
   * Check if user is an admin (admin or superadmin)
   */
  const isAdmin = useMemo((): boolean => {
    return hasAnyRole(['admin', 'superadmin']);
  }, [hasAnyRole]);

  /**
   * Check if user is a superadmin
   */
  const isSuperAdmin = useMemo((): boolean => {
    return hasRole('superadmin');
  }, [hasRole]);

  /**
   * Check if user can access admin management features
   */
  const canManageAdmins = useMemo((): boolean => {
    return isSuperAdmin;
  }, [isSuperAdmin]);

  /**
   * Check if user can create/edit customers
   */
  const canManageCustomers = useMemo((): boolean => {
    return isAdmin;
  }, [isAdmin]);

  /**
   * Check if user can create/edit gifts
   */
  const canManageGifts = useMemo((): boolean => {
    return isAdmin;
  }, [isAdmin]);

  /**
   * Get the current user's role
   */
  const currentRole = useMemo((): UserRole | null => {
    return user?.role || null;
  }, [user]);

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canManageAdmins,
    canManageCustomers,
    canManageGifts,
    currentRole,
  };
}

/**
 * Hook to handle token expiration
 */
export function useTokenExpiration() {
  const { token, logout } = useAuth();

  /**
   * Check if the current token is expired
   */
  const isExpired = useMemo((): boolean => {
    return isTokenExpired(token);
  }, [token]);

  /**
   * Get remaining time until token expires (in milliseconds)
   */
  const timeRemaining = useMemo((): number => {
    return getTimeUntilExpiry(token);
  }, [token]);

  /**
   * Check if token is about to expire (within specified minutes)
   */
  const isExpiringWithin = useCallback(
    (minutes: number): boolean => {
      const msUntilExpiry = getTimeUntilExpiry(token);
      return msUntilExpiry > 0 && msUntilExpiry <= minutes * 60 * 1000;
    },
    [token]
  );

  /**
   * Effect to auto-logout when token expires
   */
  useEffect(() => {
    if (isExpired && token) {
      console.warn('Token expired, logging out...');
      logout();
      return undefined;
    }

    // Set up a timer to check expiration
    if (token && timeRemaining > 0) {
      const timer = setTimeout(() => {
        console.warn('Token has expired');
        logout();
      }, timeRemaining);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [token, isExpired, timeRemaining, logout]);

  return {
    isExpired,
    timeRemaining,
    isExpiringWithin,
  };
}

/**
 * Hook to validate permissions before performing actions
 */
export function useSecureAction() {
  const { isAuthenticated, token, logout } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();

  /**
   * Execute an action only if authenticated
   */
  const withAuth = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      if (!isAuthenticated || isTokenExpired(token)) {
        console.warn('Not authenticated or token expired');
        await logout();
        return null;
      }
      return action();
    },
    [isAuthenticated, token, logout]
  );

  /**
   * Execute an action only if user is admin
   */
  const withAdminRole = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      if (!isAdmin) {
        console.warn('Admin role required');
        return null;
      }
      return withAuth(action);
    },
    [isAdmin, withAuth]
  );

  /**
   * Execute an action only if user is superadmin
   */
  const withSuperAdminRole = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      if (!isSuperAdmin) {
        console.warn('Superadmin role required');
        return null;
      }
      return withAuth(action);
    },
    [isSuperAdmin, withAuth]
  );

  return {
    withAuth,
    withAdminRole,
    withSuperAdminRole,
  };
}

/**
 * Hook for permission denied scenarios
 */
export function useAccessDenied() {
  const { isAuthenticated } = useAuth();
  const { isAdmin, isSuperAdmin, currentRole } = usePermissions();

  /**
   * Get appropriate error message for access denied
   */
  const getAccessDeniedMessage = useCallback(
    (requiredRole?: UserRole): string => {
      if (!isAuthenticated) {
        return 'Please log in to access this feature.';
      }

      if (requiredRole === 'superadmin' && !isSuperAdmin) {
        return 'This feature is only available to Super Administrators.';
      }

      if (requiredRole === 'admin' && !isAdmin) {
        return 'This feature is only available to Administrators.';
      }

      return 'You do not have permission to access this feature.';
    },
    [isAuthenticated, isAdmin, isSuperAdmin]
  );

  return {
    getAccessDeniedMessage,
    isAuthenticated,
    currentRole,
  };
}

export default {
  usePermissions,
  useTokenExpiration,
  useSecureAction,
  useAccessDenied,
};

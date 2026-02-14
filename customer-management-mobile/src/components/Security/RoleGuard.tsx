/**
 * Role-Based Access Control Components
 * Components for conditionally rendering based on user roles
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { usePermissions, useAccessDenied } from '../../hooks/usePermissions';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  children: ReactNode;
  /** Required role to view content */
  requiredRole?: UserRole;
  /** Allow any of these roles */
  allowedRoles?: UserRole[];
  /** What to show when access is denied */
  fallback?: ReactNode;
  /** Show access denied message instead of hiding */
  showAccessDenied?: boolean;
}

/**
 * RoleGuard Component
 * Conditionally renders children based on user role
 */
export function RoleGuard({
  children,
  requiredRole,
  allowedRoles,
  fallback,
  showAccessDenied = false,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole } = usePermissions();
  const { getAccessDeniedMessage } = useAccessDenied();

  // Check if user has required role
  let hasAccess = false;

  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasAnyRole(allowedRoles);
  } else if (requiredRole) {
    // If requiredRole is superadmin, only superadmin can access
    // If requiredRole is admin, both admin and superadmin can access
    if (requiredRole === 'admin') {
      hasAccess = hasAnyRole(['admin', 'superadmin']);
    } else {
      hasAccess = hasRole(requiredRole);
    }
  } else {
    // No role restriction, allow access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return <AccessDeniedView message={getAccessDeniedMessage(requiredRole)} />;
  }

  // Hide content by default
  return null;
}

/**
 * SuperAdminOnly Component
 * Only renders for superadmin users
 */
export function SuperAdminOnly({
  children,
  fallback,
  showAccessDenied,
}: Omit<RoleGuardProps, 'requiredRole' | 'allowedRoles'>) {
  return (
    <RoleGuard
      requiredRole="superadmin"
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * AdminOnly Component
 * Renders for admin or superadmin users
 */
export function AdminOnly({
  children,
  fallback,
  showAccessDenied,
}: Omit<RoleGuardProps, 'requiredRole' | 'allowedRoles'>) {
  return (
    <RoleGuard
      allowedRoles={['admin', 'superadmin']}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </RoleGuard>
  );
}

interface AccessDeniedViewProps {
  message?: string;
  onGoBack?: () => void;
}

/**
 * Access Denied View
 * Displayed when user doesn't have permission
 */
export function AccessDeniedView({
  message = 'You do not have permission to access this feature.',
  onGoBack,
}: AccessDeniedViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.surface}>
        <Text style={styles.icon}>🔒</Text>
        <Text variant="headlineSmall" style={styles.title}>
          Access Denied
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
        {onGoBack && (
          <Button mode="contained" onPress={onGoBack} style={styles.button}>
            Go Back
          </Button>
        )}
      </View>
    </View>
  );
}

interface PermissionGateProps {
  children: ReactNode;
  /** Permission check function */
  canAccess: boolean;
  /** Fallback content */
  fallback?: ReactNode;
}

/**
 * PermissionGate Component
 * Generic gate for any permission check
 */
export function PermissionGate({
  children,
  canAccess,
  fallback = null,
}: PermissionGateProps) {
  if (canAccess) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 320,
    elevation: 2,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    color: '#d32f2f',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});

export default {
  RoleGuard,
  SuperAdminOnly,
  AdminOnly,
  AccessDeniedView,
  PermissionGate,
};

<?php
/**
 * Role-Based Access Control Middleware
 * Ensures user has required role
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../utils/Response.php';

/**
 * Require super admin role
 * Must be called after authenticate()
 */
function requireSuperAdmin() {
    global $authUser;
    
    if (!isset($authUser['role']) || $authUser['role'] !== 'superadmin') {
        Response::forbidden('Super admin access required');
    }
}

/**
 * Require admin or super admin role
 * Must be called after authenticate()
 */
function requireAdmin() {
    global $authUser;
    
    if (!isset($authUser['role']) || !in_array($authUser['role'], ['admin', 'superadmin'])) {
        Response::forbidden('Admin access required');
    }
}

/**
 * Check if user has specific role
 * 
 * @param string $role Role to check
 * @return bool True if user has role
 */
function hasRole($role) {
    global $authUser;
    return isset($authUser['role']) && $authUser['role'] === $role;
}

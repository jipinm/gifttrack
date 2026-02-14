<?php
/**
 * Admins API - Delete Endpoint
 * DELETE /api/admins/delete.php?id={adminId}
 * 
 * Delete an admin user
 * Super Admin Only
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Apply role middleware (super admin only)
require_once __DIR__ . '/../../middleware/role.php';

// Load User model
require_once __DIR__ . '/../../models/User.php';

// Handle DELETE request
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;
    
    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }
    
    // Check if user is super admin
    if ($authUser['role'] !== 'superadmin') {
        Response::error('Access denied. Super admin role required.', 403);
    }
    
    // Get admin ID from query parameter
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        Response::error('Admin ID is required', 400);
    }
    
    $adminId = $_GET['id'];
    
    // Prevent deleting self
    if ($adminId === $authUser['id']) {
        Response::error('Cannot delete your own account', 400);
    }
    
    // Initialize User model
    $userModel = new User();
    
    // Verify admin exists
    $admin = $userModel->getById($adminId);
    if (!$admin) {
        Response::error('Admin not found', 404);
    }
    
    // Prevent deleting super admin users
    if ($admin['role'] === 'superadmin') {
        Response::error('Cannot delete super admin users', 403);
    }
    
    // Delete admin
    $result = $userModel->delete($adminId);
    
    if (!$result) {
        Response::error('Failed to delete admin', 500);
    }
    
    // Return success response
    Response::success([
        'deleted' => true,
        'adminId' => $adminId,
        'adminName' => $admin['name']
    ], 'Admin deleted successfully', 200);
    
} catch (Exception $e) {
    error_log("Error in delete admin endpoint: " . $e->getMessage());
    Response::error('An error occurred while deleting the admin', 500);
}

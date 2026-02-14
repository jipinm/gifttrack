<?php
/**
 * Admins API - Show Single Admin
 * GET /api/admins/show.php?id={adminId}
 * 
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

// Handle GET request
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
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
    
    // Initialize User model
    $userModel = new User();
    
    // Get admin by ID
    $admin = $userModel->getById($adminId);
    
    if (!$admin) {
        Response::error('Admin not found', 404);
    }
    
    // Format admin for response (excludes password)
    $formattedAdmin = $userModel->formatForResponse($admin);
    
    // Return success response
    Response::success($formattedAdmin, 'Admin retrieved successfully', 200);
    
} catch (Exception $e) {
    error_log("Error in show admin endpoint: " . $e->getMessage());
    Response::error('An error occurred while retrieving admin', 500);
}

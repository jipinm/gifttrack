<?php
/**
 * Admins API - Index Endpoint
 * GET /api/admins - Get all admins
 * POST /api/admins - Create new admin (handled separately in create.php)
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

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // GET - List all admins
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Check if user is super admin
        if ($authUser['role'] !== 'superadmin') {
            Response::error('Access denied. Super admin role required.', 403);
        }
        
        // Initialize User model
        $userModel = new User();
        
        // Get all users (will be filtered in model to exclude passwords)
        $users = $userModel->getAll();
        
        // Format users for response
        $formattedUsers = array_map(function($user) use ($userModel) {
            return $userModel->formatForResponse($user);
        }, $users);
        
        // Return success response
        Response::success($formattedUsers, 'Admins retrieved successfully', 200);
        
    } catch (Exception $e) {
        error_log("Error in admins index endpoint: " . $e->getMessage());
        Response::error('An error occurred while retrieving admins', 500);
    }
    
} elseif ($method === 'POST') {
    // POST - Create new admin (redirect to create.php or handle here)
    Response::error('Use POST /api/admins/create.php to create a new admin', 400);
    
} else {
    Response::error('Method not allowed', 405);
}

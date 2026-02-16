<?php
/**
 * Admins API - Update Endpoint
 * PUT /api/admins/update.php?id={adminId}
 * 
 * Update an existing admin
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

// Handle PUT request
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'PUT') {
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
    
    // Verify admin exists
    $existingAdmin = $userModel->getById($adminId);
    if (!$existingAdmin) {
        Response::error('Admin not found', 404);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Validate input fields
    $errors = [];
    $updateData = [];
    
    // Allow updating: name, address, place, branch, password
    if (isset($input['name'])) {
        if (empty(trim($input['name']))) {
            $errors['name'] = 'Name cannot be empty';
        } else {
            $updateData['name'] = trim($input['name']);
        }
    }
    
    if (isset($input['address'])) {
        if (empty(trim($input['address']))) {
            $errors['address'] = 'Address cannot be empty';
        } else {
            $updateData['address'] = trim($input['address']);
        }
    }
    
    if (isset($input['stateId'])) {
        $updateData['stateId'] = intval($input['stateId']);
    }
    
    if (isset($input['districtId'])) {
        $updateData['districtId'] = intval($input['districtId']);
    }
    
    if (isset($input['cityId'])) {
        $updateData['cityId'] = intval($input['cityId']);
    }
    
    if (isset($input['branch'])) {
        if (empty(trim($input['branch']))) {
            $errors['branch'] = 'Branch cannot be empty';
        } else {
            $updateData['branch'] = trim($input['branch']);
        }
    }
    
    // Password update (optional)
    if (isset($input['password']) && !empty($input['password'])) {
        if (strlen($input['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        } else {
            $updateData['password'] = $input['password']; // Will be hashed in model
        }
    }
    
    // Prevent updating role
    if (isset($input['role'])) {
        $errors['role'] = 'Role cannot be updated';
    }
    
    // Prevent updating mobile number
    if (isset($input['mobileNumber'])) {
        $errors['mobileNumber'] = 'Mobile number cannot be updated';
    }
    
    if (!empty($errors)) {
        Response::error('Validation failed', 400, $errors);
    }
    
    if (empty($updateData)) {
        Response::error('No fields to update', 400);
    }
    
    // Update admin
    $result = $userModel->update($adminId, $updateData);
    
    if (!$result) {
        Response::error('Failed to update admin', 500);
    }
    
    // Get updated admin with all details
    $admin = $userModel->getById($adminId);
    $formattedAdmin = $userModel->formatForResponse($admin);
    
    // Return success response
    Response::success($formattedAdmin, 'Admin updated successfully', 200);
    
} catch (Exception $e) {
    error_log("Error in update admin endpoint: " . $e->getMessage());
    Response::error('An error occurred while updating the admin', 500);
}

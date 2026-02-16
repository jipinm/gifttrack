<?php
/**
 * Admins API - Create Endpoint
 * POST /api/admins/create.php
 * 
 * Create a new admin user
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

// Handle POST request
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'POST') {
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
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $errors = [];
    
    if (!isset($input['name']) || empty(trim($input['name']))) {
        $errors['name'] = 'Name is required';
    }
    
    if (!isset($input['mobileNumber']) || empty($input['mobileNumber'])) {
        $errors['mobileNumber'] = 'Mobile number is required';
    } elseif (!Validator::validateMobileNumber($input['mobileNumber'])) {
        $errors['mobileNumber'] = 'Mobile number must be exactly 10 digits';
    }
    
    if (!isset($input['password']) || empty($input['password'])) {
        $errors['password'] = 'Password is required';
    } elseif (strlen($input['password']) < 6) {
        $errors['password'] = 'Password must be at least 6 characters';
    }
    
    if (!isset($input['address']) || empty(trim($input['address']))) {
        $errors['address'] = 'Address is required';
    }
    
    if (!isset($input['stateId']) || empty($input['stateId'])) {
        $errors['stateId'] = 'State is required';
    }
    
    if (!isset($input['districtId']) || empty($input['districtId'])) {
        $errors['districtId'] = 'District is required';
    }
    
    if (!isset($input['cityId']) || empty($input['cityId'])) {
        $errors['cityId'] = 'City is required';
    }
    
    // Branch is optional
    // No validation needed for branch
    
    if (!empty($errors)) {
        Response::error('Validation failed', 400, $errors);
    }
    
    // Initialize User model
    $userModel = new User();
    
    // Check if mobile number already exists
    $existingUser = $userModel->findByMobileNumber($input['mobileNumber']);
    if ($existingUser) {
        Response::error('Mobile number already exists', 400, [
            'mobileNumber' => 'This mobile number is already registered'
        ]);
    }
    
    // Prepare admin data
    $adminData = [
        'name' => trim($input['name']),
        'mobileNumber' => $input['mobileNumber'], // camelCase for model
        'password' => $input['password'], // Will be hashed in model
        'address' => trim($input['address']),
        'stateId' => intval($input['stateId']),
        'districtId' => intval($input['districtId']),
        'cityId' => intval($input['cityId']),
        'branch' => isset($input['branch']) ? trim($input['branch']) : '',
        'role' => 'admin' // Always create as admin, not superadmin
    ];
    
    // Create admin
    $adminId = $userModel->create($adminData);
    
    if (!$adminId) {
        Response::error('Failed to create admin', 500);
    }
    
    // Get created admin with all details
    $admin = $userModel->getById($adminId);
    $formattedAdmin = $userModel->formatForResponse($admin);
    
    // Return success response
    Response::success($formattedAdmin, 'Admin created successfully', 201);
    
} catch (Exception $e) {
    error_log("Error in create admin endpoint: " . $e->getMessage());
    Response::error('An error occurred while creating the admin', 500);
}

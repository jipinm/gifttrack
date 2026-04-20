<?php
/**
 * Admin Self-Registration Endpoint  (PUBLIC — no auth required)
 * POST /api/auth/register
 *
 * Allows anyone to request an Admin account.
 * Account is created with status = 'pending' and CANNOT log in
 * until a Super Admin approves it.
 */

// Load bootstrap (no auth / role middleware)
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/rate-limit.php';
require_once __DIR__ . '/../../models/User.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Basic rate limiting for registration
try {
    checkRateLimit('register');
} catch (Exception $e) {
    // Non-fatal — continue
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
        Response::error('Invalid JSON input', 400);
    }

    // -------------------------------------------------------------------------
    // Validate required fields
    // -------------------------------------------------------------------------
    $errors = [];

    $name = isset($input['name']) ? trim($input['name']) : '';
    if (empty($name)) {
        $errors['name'] = 'Name is required';
    } elseif (mb_strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }

    $mobileNumber = isset($input['mobileNumber']) ? trim($input['mobileNumber']) : '';
    if (empty($mobileNumber)) {
        $errors['mobileNumber'] = 'Mobile number is required';
    } elseif (!Validator::validateMobileNumber($mobileNumber)) {
        $errors['mobileNumber'] = 'Mobile number must be exactly 10 digits';
    }

    $password = $input['password'] ?? '';
    if (empty($password)) {
        $errors['password'] = 'Password is required';
    } elseif (strlen($password) < 6) {
        $errors['password'] = 'Password must be at least 6 characters';
    }

    $address = isset($input['address']) ? trim($input['address']) : '';
    if (empty($address)) {
        $errors['address'] = 'Address is required';
    }

    if (!empty($errors)) {
        Response::error('Validation failed', 400, $errors);
    }

    // -------------------------------------------------------------------------
    // Check for duplicate mobile number
    // -------------------------------------------------------------------------
    $userModel = new User();
    $existing = $userModel->findByMobileNumber($mobileNumber);
    if ($existing) {
        Response::error('Registration failed', 400, [
            'mobileNumber' => 'This mobile number is already registered'
        ]);
    }

    // -------------------------------------------------------------------------
    // Create admin with status = 'pending'
    // -------------------------------------------------------------------------
    $adminData = [
        'name'       => $name,
        'mobileNumber' => $mobileNumber,
        'password'   => $password,       // will be hashed by User::create()
        'address'    => $address,
        'stateId'    => isset($input['stateId'])    ? intval($input['stateId'])    : null,
        'districtId' => isset($input['districtId']) ? intval($input['districtId']) : null,
        'cityId'     => isset($input['cityId'])     ? intval($input['cityId'])     : null,
        'branch'     => isset($input['branch'])     ? trim($input['branch'])       : '',
        'role'       => 'admin',
        'status'     => 'pending',
    ];

    $userId = $userModel->create($adminData);

    if (!$userId) {
        Response::error('Registration failed. Please try again.', 500);
    }

    // Return success — do NOT return the password or a login token
    Response::success(
        ['id' => $userId, 'name' => $name, 'mobileNumber' => $mobileNumber, 'status' => 'pending'],
        'Your registration request has been submitted and is pending approval by the Super Admin. You will be able to log in once approved.',
        201
    );

} catch (PDOException $e) {
    error_log('Registration DB error: ' . $e->getMessage());
    Response::error('Database error. Please try again later.', 500);
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    Response::error('An error occurred during registration.', 500);
}

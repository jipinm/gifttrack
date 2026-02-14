<?php
/**
 * User Login Endpoint
 * POST /api/auth/login
 * 
 * Authenticates user with mobile number and password
 * Returns JWT token on successful authentication
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Load middleware
require_once __DIR__ . '/../../middleware/rate-limit.php';
require_once __DIR__ . '/../../utils/Logger.php';

// Load User model
require_once __DIR__ . '/../../models/User.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Check rate limit for login attempts (wrap in try-catch)
try {
    checkRateLimit('login');
} catch (Exception $e) {
    error_log("Rate limit error: " . $e->getMessage());
    // Continue even if rate limiting fails
}

$startTime = microtime(true);

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Support both camelCase and snake_case for backward compatibility
    $mobileNumber = $input['mobile_number'] ?? $input['mobileNumber'] ?? null;
    $password = $input['password'] ?? null;
    
    // Validate required fields
    if (!$mobileNumber || !$password) {
        try {
            logAuth($mobileNumber ?? 'unknown', false, 'Missing credentials');
        } catch (Exception $e) {
            // Ignore logging errors
        }
        Response::error('Mobile number and password are required', 400);
    }
    
    $mobileNumber = trim($mobileNumber);
    
    // Validate mobile number format (10 digits)
    if (!Validator::validateMobileNumber($mobileNumber)) {
        Response::error('Invalid mobile number format. Must be 10 digits', 400);
    }
    
    // Validate password
    if (empty($password)) {
        Response::error('Password is required', 400);
    }
    
    // Initialize User model
    $userModel = new User();
    
    // Find user by mobile number
    $user = $userModel->findByMobileNumber($mobileNumber);
    
    if (!$user) {
        try {
            logAuth($mobileNumber, false, 'User not found');
        } catch (Exception $e) {
            // Ignore logging errors
        }
        Response::error('Invalid credentials', 401);
    }
    
    // Verify password
    if (!$userModel->verifyPassword($password, $user['password'])) {
        try {
            logAuth($mobileNumber, false, 'Invalid password');
        } catch (Exception $e) {
            // Ignore logging errors
        }
        Response::error('Invalid credentials', 401);
    }
    
    // Generate JWT token
    $tokenPayload = [
        'id' => $user['id'],
        'mobileNumber' => $user['mobile_number'],
        'name' => $user['name'],
        'role' => $user['role']
    ];
    
    $token = JWT::generate($tokenPayload);
    
    // Format user data for response (exclude password)
    $userData = $userModel->formatForResponse($user);
    
    // Log successful login (non-blocking)
    try {
        logAuth($mobileNumber, true, 'Login successful');
        error_log("User logged in: {$user['mobile_number']} ({$user['role']})");
        
        // Log request with execution time
        $executionTime = microtime(true) - $startTime;
        logRequest([
            'user_id' => $user['id'],
            'user_role' => $user['role'],
            'execution_time' => round($executionTime, 4)
        ]);
    } catch (Exception $e) {
        // Ignore logging errors
    }
    
    // Return success response
    Response::success([
        'token' => $token,
        'user' => $userData
    ], 'Login successful', 200);
    
} catch (PDOException $e) {
    error_log("Login database error: " . $e->getMessage());
    Response::error('Database connection error. Please try again later.', 500);
} catch (Exception $e) {
    try {
        logError('Login error', $e);
    } catch (Exception $logE) {
        // Ignore logging errors
    }
    error_log("Login error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    
    // In development, show detailed error; in production show generic message
    $isDev = ($_ENV['ENVIRONMENT'] ?? 'production') === 'development';
    $errorMessage = $isDev 
        ? 'Login error: ' . $e->getMessage() 
        : 'An error occurred during login';
    
    Response::error($errorMessage, 500);
}

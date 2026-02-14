<?php
/**
 * Authentication Middleware
 * Validates JWT token and attaches user data to request
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/TokenBlacklist.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

/**
 * Authenticate request
 * Returns authenticated user data or sends 401 response
 * 
 * @return array User data from token
 */
function authenticate() {
    // Get token from Authorization header
    $token = JWT::getTokenFromHeader();
    
    if (!$token) {
        Response::unauthorized('Authorization token is required');
    }
    
    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted($token)) {
        Response::unauthorized('Token has been invalidated. Please login again.');
    }
    
    // Validate token
    $decoded = JWT::validate($token);
    
    if (!$decoded) {
        Response::unauthorized('Invalid or expired token');
    }
    
    // Return user data
    if (isset($decoded->data)) {
        return (array) $decoded->data;
    }
    
    Response::unauthorized('Invalid token payload');
}

/**
 * Get authenticated user from global scope
 * Call authenticate() first to set this
 */
function getAuthUser() {
    global $authUser;
    return $authUser ?? null;
}

// Automatically authenticate and store in global variable
$authUser = authenticate();

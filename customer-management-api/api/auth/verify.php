<?php
/**
 * Verify Token Endpoint
 * GET /api/auth/verify
 * 
 * Verifies if the JWT token is valid and returns user data
 * Used to check if user session is still valid
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

try {
    // Get authenticated user from middleware
    global $authUser;
    
    if (!$authUser) {
        Response::error('Invalid or expired token', 401);
    }
    
    // Return user data
    Response::success([
        'user' => $authUser
    ], 'Token is valid', 200);
    
} catch (Exception $e) {
    error_log("Token verification error: " . $e->getMessage());
    Response::error('An error occurred during token verification', 500);
}

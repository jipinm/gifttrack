<?php
/**
 * User Logout Endpoint
 * POST /api/auth/logout
 * 
 * Logs out the authenticated user
 * Blacklists the token to prevent further use
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Load token blacklist before auth middleware
require_once __DIR__ . '/../../utils/TokenBlacklist.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    // Get authenticated user from middleware
    global $authUser;
    
    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }
    
    // Get the token and blacklist it
    $token = JWT::getTokenFromHeader();
    if ($token) {
        // Decode to get expiration time
        $decoded = JWT::decode($token);
        $expiresAt = isset($decoded->exp) ? $decoded->exp : time() + 86400;
        
        // Add token to blacklist
        blacklistToken($token, $expiresAt);
    }
    
    // Log logout activity
    error_log("User logged out: {$authUser['mobileNumber']} ({$authUser['role']})");
    
    // Return success response
    Response::success(null, 'Logout successful', 200);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    Response::error('An error occurred during logout', 500);
}

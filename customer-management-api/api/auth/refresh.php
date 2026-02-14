<?php
/**
 * Token Refresh Endpoint
 * POST /api/auth/refresh
 * 
 * Refreshes JWT token for authenticated user
 * Extends session without requiring re-login
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/rate-limit.php';
require_once __DIR__ . '/../../utils/Logger.php';

use Utils\JWT;
use Utils\Response;

header('Content-Type: application/json');

// Check rate limit
checkRateLimit('api');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

$startTime = microtime(true);

try {
    // authUser is set by auth middleware
    if (!isset($GLOBALS['authUser'])) {
        Response::error('Unauthorized', 401);
    }
    
    $user = $GLOBALS['authUser'];
    
    // Generate new JWT token with same user data
    $tokenPayload = [
        'id' => $user['id'],
        'mobileNumber' => $user['mobileNumber'],
        'name' => $user['name'],
        'role' => $user['role']
    ];
    
    $newToken = JWT::generate($tokenPayload);
    
    // Log token refresh
    logInfo('Token refreshed', [
        'user_id' => $user['id'],
        'role' => $user['role']
    ]);
    
    // Log request
    $executionTime = microtime(true) - $startTime;
    logRequest([
        'user_id' => $user['id'],
        'user_role' => $user['role'],
        'execution_time' => round($executionTime, 4)
    ]);
    
    Response::success([
        'token' => $newToken,
        'user' => $user
    ], 'Token refreshed successfully');
    
} catch (Exception $e) {
    logError('Token refresh error', $e);
    Response::error('Failed to refresh token', 500);
}

<?php
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing headers
 */

// Load CORS configuration
$corsConfig = require __DIR__ . '/../config/cors.php';

// Set CORS headers
header("Access-Control-Allow-Origin: " . $corsConfig['origin']);
header("Access-Control-Allow-Methods: " . $corsConfig['methods']);
header("Access-Control-Allow-Headers: " . $corsConfig['headers']);
header("Access-Control-Max-Age: " . $corsConfig['max_age']);

if ($corsConfig['credentials']) {
    header("Access-Control-Allow-Credentials: true");
}

// Handle preflight OPTIONS request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}

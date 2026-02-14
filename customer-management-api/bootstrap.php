<?php
/**
 * Bootstrap File
 * Initialize application, load dependencies, and set common headers
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to client
ini_set('log_errors', 1);

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Load Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables (with safe fallback)
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->safeLoad(); // Use safeLoad to not throw if .env doesn't exist
} catch (Exception $e) {
    error_log('Failed to load .env file: ' . $e->getMessage());
}

// Load utility classes
require_once __DIR__ . '/utils/Database.php';
require_once __DIR__ . '/utils/JWT.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Validator.php';

// Set JSON content type
header('Content-Type: application/json; charset=utf-8');

// Apply CORS middleware
require_once __DIR__ . '/middleware/cors.php';

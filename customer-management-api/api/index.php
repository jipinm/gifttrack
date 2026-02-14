<?php
/**
 * Test endpoint to verify API is working
 */

require_once __DIR__ . '/../bootstrap.php';

Response::success([
    'message' => 'Customer Management API is running',
    'version' => '1.0.0',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => $_ENV['ENVIRONMENT'] ?? 'development'
]);

<?php
/**
 * Test Authorization Header Detection
 * 
 * This script helps diagnose Authorization header issues
 * 
 * Usage:
 * curl http://customer-management-api.local/test_auth_header.php \
 *   -H "Authorization: Bearer test-token-123"
 */

header('Content-Type: application/json');

echo json_encode([
    'methods_checked' => [
        'getallheaders' => function_exists('getallheaders'),
        'apache_request_headers' => function_exists('apache_request_headers'),
    ],
    'headers' => [
        'getallheaders' => function_exists('getallheaders') ? getallheaders() : 'not available',
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'not set',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'not set',
    ],
    'all_server_vars' => array_filter($_SERVER, function($key) {
        return strpos($key, 'AUTH') !== false || strpos($key, 'HTTP_') === 0;
    }, ARRAY_FILTER_USE_KEY)
], JSON_PRETTY_PRINT);

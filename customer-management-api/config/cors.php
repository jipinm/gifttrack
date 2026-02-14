<?php
/**
 * CORS Configuration
 */

return [
    'origin' => $_ENV['CORS_ORIGIN'] ?? '*',
    'methods' => $_ENV['CORS_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS',
    'headers' => $_ENV['CORS_HEADERS'] ?? 'Content-Type,Authorization,X-Requested-With',
    'credentials' => true,
    'max_age' => 86400, // 24 hours
];

<?php
/**
 * JWT Configuration
 */

return [
    'secret' => $_ENV['JWT_SECRET'] ?? 'change-this-secret-key',
    'algorithm' => 'HS256',
    'issuer' => $_ENV['JWT_ISSUER'] ?? 'customer-management-api',
    'audience' => $_ENV['JWT_AUDIENCE'] ?? 'customer-management-mobile',
    'expiry' => (int)($_ENV['JWT_EXPIRY'] ?? 86400), // 24 hours in seconds
];

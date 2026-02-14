<?php
/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Returns the health status of the API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Try to load bootstrap
$bootstrapLoaded = false;
try {
    require_once __DIR__ . '/../bootstrap.php';
    $bootstrapLoaded = true;
} catch (Exception $e) {
    // Continue with basic health check
}

$health = [
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'checks' => [
        'bootstrap' => $bootstrapLoaded ? 'ok' : 'failed'
    ]
];

// Check environment variables
$envVars = ['DB_HOST', 'DB_NAME', 'JWT_SECRET'];
$envCheck = true;
foreach ($envVars as $var) {
    $value = $_ENV[$var] ?? getenv($var) ?? null;
    if (empty($value)) {
        $envCheck = false;
        $health['checks']['env_' . strtolower($var)] = 'missing';
    } else {
        $health['checks']['env_' . strtolower($var)] = 'set';
    }
}
$health['checks']['environment'] = $envCheck ? 'ok' : 'missing_vars';

// Check database connection if bootstrap loaded
if ($bootstrapLoaded) {
    try {
        $db = Database::getInstance();
        $stmt = $db->getConnection()->query("SELECT 1 as test");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $health['checks']['database'] = $result ? 'ok' : 'failed';
    } catch (Exception $e) {
        $health['checks']['database'] = 'error: ' . $e->getMessage();
        $health['status'] = 'degraded';
    }
}

// Check if logs directory is writable
$logsDir = __DIR__ . '/../logs';
$health['checks']['logs_writable'] = (is_dir($logsDir) && is_writable($logsDir)) ? 'ok' : 'not_writable';

// Return health status
http_response_code($health['status'] === 'ok' ? 200 : 503);
echo json_encode(['success' => true, 'data' => $health, 'message' => 'Health check complete']);

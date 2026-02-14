<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/Cache.php';

try {
    // Cache key for states data
    $cacheKey = 'master_data:states';
    
    // Try to get from cache (TTL: 24 hours)
    $states = cache_remember($cacheKey, function() {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT id, name, code FROM states ORDER BY name ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }, 86400);
    
    // Add cache headers
    header('Cache-Control: public, max-age=86400'); // 24 hours
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
    
    Response::success($states);
    
} catch (Exception $e) {
    error_log("Error fetching states: " . $e->getMessage());
    Response::error('Failed to fetch states', 500);
}

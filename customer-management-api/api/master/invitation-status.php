<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/Cache.php';

try {
    $cacheKey = 'master_data:invitation_status';
    
    // Get from cache or fetch from database
    $invitationStatus = cache_remember($cacheKey, function() {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT id, name FROM invitation_status ORDER BY id ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }, 86400); // 24-hour cache
    
    // Set HTTP cache headers
    header('Cache-Control: public, max-age=86400');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
    
    Response::success($invitationStatus);
    
} catch (Exception $e) {
    error_log("Error fetching invitation status: " . $e->getMessage());
    Response::error('Failed to fetch invitation status', 500);
}

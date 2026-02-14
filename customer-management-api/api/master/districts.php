<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/Cache.php';

try {
    // Optional state filter
    $stateId = $_GET['stateId'] ?? null;
    
    // Build cache key based on filter
    $cacheKey = 'master_data:districts' . ($stateId ? ':state_' . $stateId : '');
    
    // Get from cache or fetch from database
    $districts = cache_remember($cacheKey, function() use ($stateId) {
        $db = Database::getInstance()->getConnection();
        
        $query = "SELECT id, name, state_id FROM districts";
        
        if ($stateId) {
            $query .= " WHERE state_id = :stateId";
        }
        
        $query .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($query);
        
        if ($stateId) {
            $stmt->bindParam(':stateId', $stateId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }, 86400); // 24-hour cache
    
    // Set HTTP cache headers
    header('Cache-Control: public, max-age=86400');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
    
    Response::success($districts);
    
} catch (Exception $e) {
    error_log("Error fetching districts: " . $e->getMessage());
    Response::error('Failed to fetch districts', 500);
}

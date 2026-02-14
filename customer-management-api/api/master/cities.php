<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/Cache.php';

try {
    // Optional district filter
    $districtId = $_GET['districtId'] ?? null;
    
    // Build cache key based on filter
    $cacheKey = 'master_data:cities' . ($districtId ? ':district_' . $districtId : '');
    
    // Get from cache or fetch from database
    $cities = cache_remember($cacheKey, function() use ($districtId) {
        $db = Database::getInstance()->getConnection();
        
        $query = "SELECT id, name, district_id FROM cities";
        
        if ($districtId) {
            $query .= " WHERE district_id = :districtId";
        }
        
        $query .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($query);
        
        if ($districtId) {
            $stmt->bindParam(':districtId', $districtId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }, 86400); // 24-hour cache
    
    // Set HTTP cache headers
    header('Cache-Control: public, max-age=86400');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
    
    Response::success($cities);
    
} catch (Exception $e) {
    error_log("Error fetching cities: " . $e->getMessage());
    Response::error('Failed to fetch cities', 500);
}

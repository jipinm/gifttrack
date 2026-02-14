<?php
/**
 * Master Data - Gift Types
 * GET    /api/master/gift-types.php         - List all gift types
 * POST   /api/master/gift-types.php         - Create gift type (Super Admin)
 * PUT    /api/master/gift-types.php?id={id} - Update gift type (Super Admin)
 * DELETE /api/master/gift-types.php?id={id} - Delete gift type (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

if ($method === 'GET') {
    try {
        $cacheKey = 'master_data:gift_types';
        
        $giftTypes = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name FROM gift_types ORDER BY id ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }, 86400);
        
        header('Cache-Control: public, max-age=86400');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
        
        Response::success($giftTypes);
        
    } catch (Exception $e) {
        error_log("Error fetching gift types: " . $e->getMessage());
        Response::error('Failed to fetch gift types', 500);
    }

} elseif ($method === 'POST') {
    requireSuperAdmin();
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['name'])) {
            Response::error('Name is required', 400);
        }
        
        $name = Validator::sanitize($input['name']);
        
        // Check duplicate
        $stmt = $db->prepare("SELECT id FROM gift_types WHERE LOWER(name) = LOWER(?)");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Gift type already exists', 409);
        }
        
        $stmt = $db->prepare("INSERT INTO gift_types (name) VALUES (?)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:gift_types');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Gift type created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating gift type: " . $e->getMessage());
        Response::error('Failed to create gift type', 500);
    }

} elseif ($method === 'PUT') {
    requireSuperAdmin();
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['name'])) {
            Response::error('Name is required', 400);
        }
        
        $name = Validator::sanitize($input['name']);
        
        // Check exists
        $stmt = $db->prepare("SELECT id FROM gift_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Gift type not found', 404);
        }
        
        // Check duplicate (excluding current)
        $stmt = $db->prepare("SELECT id FROM gift_types WHERE LOWER(name) = LOWER(?) AND id != ?");
        $stmt->execute([$name, (int)$id]);
        if ($stmt->fetch()) {
            Response::error('Gift type name already exists', 409);
        }
        
        $stmt = $db->prepare("UPDATE gift_types SET name = ? WHERE id = ?");
        $stmt->execute([$name, (int)$id]);
        
        cache_forget('master_data:gift_types');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Gift type updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating gift type: " . $e->getMessage());
        Response::error('Failed to update gift type', 500);
    }

} elseif ($method === 'DELETE') {
    requireSuperAdmin();
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        // Check exists
        $stmt = $db->prepare("SELECT id FROM gift_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Gift type not found', 404);
        }
        
        // Check if in use
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM gifts WHERE gift_type_id = ?");
        $stmt->execute([(int)$id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($count > 0) {
            Response::error("Cannot delete: gift type is used by {$count} gift(s)", 409);
        }
        
        $stmt = $db->prepare("DELETE FROM gift_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:gift_types');
        
        Response::success(null, 'Gift type deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting gift type: " . $e->getMessage());
        Response::error('Failed to delete gift type', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

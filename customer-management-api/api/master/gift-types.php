<?php
/**
 * Master Data - Gift Types
 * GET    /api/master/gift-types.php             - List all gift types (active only by default)
 * GET    /api/master/gift-types.php?all=1       - List all gift types including inactive (Super Admin)
 * POST   /api/master/gift-types.php             - Create gift type (Super Admin)
 * PUT    /api/master/gift-types.php?id={id}     - Update gift type (Super Admin)
 * PATCH  /api/master/gift-types.php?id={id}     - Toggle active status (Super Admin)
 * DELETE /api/master/gift-types.php?id={id}     - Delete gift type (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

if ($method === 'GET') {
    try {
        // Check if requesting all (including inactive) - Super Admin only
        $includeAll = isset($_GET['all']) && $_GET['all'] == '1';
        
        if ($includeAll) {
            global $authUser;
            if (!$authUser || $authUser['role'] !== 'superadmin') {
                Response::error('Access denied', 403);
                exit;
            }
            
            $stmt = $db->query("SELECT id, name, is_active, is_default FROM gift_types ORDER BY id ASC");
            $giftTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $giftTypes = array_map(function($item) {
                $item['isActive'] = (bool)$item['is_active'];
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_active'], $item['is_default']);
                return $item;
            }, $giftTypes);
            
            Response::success($giftTypes);
            exit;
        }
        
        $cacheKey = 'master_data:gift_types_active';
        
        $giftTypes = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name, is_default FROM gift_types WHERE is_active = 1 ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function($item) {
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_default']);
                return $item;
            }, $rows);
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
        
        $stmt = $db->prepare("INSERT INTO gift_types (name, is_active) VALUES (?, 1)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:gift_types_active');
        
        Response::success(['id' => (int)$id, 'name' => $name, 'isActive' => true, 'isDefault' => false], 'Gift type created successfully', 201);
        
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
        
        cache_forget('master_data:gift_types_active');
        
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
            Response::error(
                "You cannot delete this gift type because it is being used by {$count} gift(s). Please remove or change the gift type in those gifts first, or disable it instead of deleting.",
                409
            );
        }
        
        $stmt = $db->prepare("DELETE FROM gift_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:gift_types_active');
        
        Response::success(null, 'Gift type deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting gift type: " . $e->getMessage());
        Response::error('Failed to delete gift type', 500);
    }

} elseif ($method === 'PATCH') {
    requireSuperAdmin();
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        $action = $_GET['action'] ?? null;
        
        if ($action === 'set-default') {
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM gift_types WHERE id = ?");
            $stmt->execute([(int)$id]);
            $giftType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$giftType) {
                Response::error('Gift type not found', 404);
            }
            
            if (!$giftType['is_active']) {
                Response::error('Cannot set a disabled item as default', 400);
            }
            
            $db->exec("UPDATE gift_types SET is_default = 0");
            $stmt = $db->prepare("UPDATE gift_types SET is_default = 1 WHERE id = ?");
            $stmt->execute([(int)$id]);
            
            cache_forget('master_data:gift_types_active');
            
            Response::success([
                'id' => (int)$id,
                'name' => $giftType['name'],
                'isActive' => (bool)$giftType['is_active'],
                'isDefault' => true
            ], 'Default gift type set successfully');
        } else {
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM gift_types WHERE id = ?");
            $stmt->execute([(int)$id]);
            $giftType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$giftType) {
                Response::error('Gift type not found', 404);
            }
            
            $newStatus = $giftType['is_active'] ? 0 : 1;
            $newDefault = $giftType['is_default'];
            if (!$newStatus && $giftType['is_default']) {
                $newDefault = 0;
            }
            
            $stmt = $db->prepare("UPDATE gift_types SET is_active = ?, is_default = ? WHERE id = ?");
            $stmt->execute([$newStatus, $newDefault, (int)$id]);
            
            cache_forget('master_data:gift_types_active');
            
            $statusText = $newStatus ? 'enabled' : 'disabled';
            Response::success([
                'id' => (int)$id, 
                'name' => $giftType['name'], 
                'isActive' => (bool)$newStatus,
                'isDefault' => (bool)$newDefault
            ], "Gift type {$statusText} successfully");
        }
        
    } catch (Exception $e) {
        error_log("Error toggling gift type status: " . $e->getMessage());
        Response::error('Failed to toggle gift type status', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

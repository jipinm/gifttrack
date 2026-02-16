<?php
/**
 * Master Data - Care Of Options
 * GET    /api/master/care-of-options.php             - List all care-of options (active only by default)
 * GET    /api/master/care-of-options.php?all=1       - List all care-of options including inactive (Super Admin)
 * POST   /api/master/care-of-options.php             - Create care-of option (Super Admin)
 * PUT    /api/master/care-of-options.php?id={id}     - Update care-of option (Super Admin)
 * PATCH  /api/master/care-of-options.php?id={id}     - Toggle active status (Super Admin)
 * DELETE /api/master/care-of-options.php?id={id}     - Delete care-of option (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = strtoupper($_SERVER['REQUEST_METHOD']);
$db = Database::getInstance()->getConnection();

if ($method === 'GET') {
    try {
        $includeAll = isset($_GET['all']) && $_GET['all'] == '1';
        
        if ($includeAll) {
            global $authUser;
            if (!$authUser || $authUser['role'] !== 'superadmin') {
                Response::error('Access denied', 403);
                exit;
            }
            
            $stmt = $db->query("SELECT id, name, is_active, is_default FROM care_of_options ORDER BY id ASC");
            $careOfOptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $careOfOptions = array_map(function($item) {
                $item['isActive'] = (bool)$item['is_active'];
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_active'], $item['is_default']);
                return $item;
            }, $careOfOptions);
            
            Response::success($careOfOptions);
            exit;
        }
        
        $cacheKey = 'master_data:care_of_options_active';
        
        $careOfOptions = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name, is_default FROM care_of_options WHERE is_active = 1 ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function($item) {
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_default']);
                return $item;
            }, $rows);
        }, 86400);
        
        header('Cache-Control: public, max-age=86400');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
        
        Response::success($careOfOptions);
        
    } catch (Exception $e) {
        error_log("Error fetching care-of options: " . $e->getMessage());
        Response::error('Failed to fetch care-of options', 500);
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
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE LOWER(name) = LOWER(?)");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Care-of option already exists', 409);
        }
        
        $stmt = $db->prepare("INSERT INTO care_of_options (name, is_active) VALUES (?, 1)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success(['id' => (int)$id, 'name' => $name, 'isActive' => true, 'isDefault' => false], 'Care-of option created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating care-of option: " . $e->getMessage());
        Response::error('Failed to create care-of option', 500);
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
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Care-of option not found', 404);
        }
        
        // Check duplicate (excluding current)
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE LOWER(name) = LOWER(?) AND id != ?");
        $stmt->execute([$name, (int)$id]);
        if ($stmt->fetch()) {
            Response::error('Care-of option name already exists', 409);
        }
        
        $stmt = $db->prepare("UPDATE care_of_options SET name = ? WHERE id = ?");
        $stmt->execute([$name, (int)$id]);
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Care-of option updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating care-of option: " . $e->getMessage());
        Response::error('Failed to update care-of option', 500);
    }

} elseif ($method === 'DELETE') {
    requireSuperAdmin();
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        // Check exists
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Care-of option not found', 404);
        }
        
        // Check if in use
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM event_customers WHERE care_of_id = ?");
        $stmt->execute([(int)$id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($count > 0) {
            Response::error(
                "You cannot delete this care-of option because it is being used by {$count} customer attachment(s). Please change the care-of option in those attachments first, or disable it instead of deleting.",
                409
            );
        }
        
        $stmt = $db->prepare("DELETE FROM care_of_options WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success(null, 'Care-of option deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting care-of option: " . $e->getMessage());
        Response::error('Failed to delete care-of option', 500);
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
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM care_of_options WHERE id = ?");
            $stmt->execute([(int)$id]);
            $careOfOption = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$careOfOption) {
                Response::error('Care-of option not found', 404);
            }
            
            if (!$careOfOption['is_active']) {
                Response::error('Cannot set a disabled item as default', 400);
            }
            
            $db->exec("UPDATE care_of_options SET is_default = 0");
            $stmt = $db->prepare("UPDATE care_of_options SET is_default = 1 WHERE id = ?");
            $stmt->execute([(int)$id]);
            
            cache_forget('master_data:care_of_options_active');
            
            Response::success([
                'id' => (int)$id,
                'name' => $careOfOption['name'],
                'isActive' => (bool)$careOfOption['is_active'],
                'isDefault' => true
            ], 'Default care-of option set successfully');
        } else {
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM care_of_options WHERE id = ?");
            $stmt->execute([(int)$id]);
            $careOfOption = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$careOfOption) {
                Response::error('Care-of option not found', 404);
            }
            
            $newStatus = $careOfOption['is_active'] ? 0 : 1;
            $newDefault = $careOfOption['is_default'];
            if (!$newStatus && $careOfOption['is_default']) {
                $newDefault = 0;
            }
            
            $stmt = $db->prepare("UPDATE care_of_options SET is_active = ?, is_default = ? WHERE id = ?");
            $stmt->execute([$newStatus, $newDefault, (int)$id]);
            
            cache_forget('master_data:care_of_options_active');
            
            $statusText = $newStatus ? 'enabled' : 'disabled';
            Response::success([
                'id' => (int)$id, 
                'name' => $careOfOption['name'], 
                'isActive' => (bool)$newStatus,
                'isDefault' => (bool)$newDefault
            ], "Care-of option {$statusText} successfully");
        }
        
    } catch (Exception $e) {
        error_log("Error toggling care-of option status: " . $e->getMessage());
        Response::error('Failed to toggle care-of option status', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

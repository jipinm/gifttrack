<?php
/**
 * Master Data - Care Of Options (User-Specific)
 * 
 * Care-of options are fully user-specific. Each user manages their own options.
 * Only options created by the logged-in user are visible and manageable.
 * 
 * GET    /api/master/care-of-options.php             - List user's own care-of options (active only)
 * GET    /api/master/care-of-options.php?all=1       - List all user's own care-of options including inactive (for management)
 * POST   /api/master/care-of-options.php             - Create care-of option (saved as user-specific)
 * PUT    /api/master/care-of-options.php?id={id}     - Update own care-of option
 * PATCH  /api/master/care-of-options.php?id={id}     - Toggle active / set default (own options only)
 * DELETE /api/master/care-of-options.php?id={id}     - Delete own care-of option
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/Cache.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);
$db = Database::getInstance()->getConnection();
$userId = $authUser['id'];

if ($method === 'GET') {
    try {
        $includeAll = isset($_GET['all']) && $_GET['all'] == '1';
        
        if ($includeAll) {
            // Management view: show only user's own options (including inactive)
            $stmt = $db->prepare(
                "SELECT id, name, is_active, is_default 
                 FROM care_of_options 
                 WHERE created_by = :userId
                 ORDER BY id ASC"
            );
            $stmt->execute(['userId' => $userId]);
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
        
        // Dropdown view: active options created by this user only
        $stmt = $db->prepare(
            "SELECT id, name, is_default 
             FROM care_of_options 
             WHERE is_active = 1 AND created_by = :userId
             ORDER BY id ASC"
        );
        $stmt->execute(['userId' => $userId]);
        $careOfOptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $careOfOptions = array_map(function($item) {
            $item['isDefault'] = (bool)$item['is_default'];
            unset($item['is_default']);
            return $item;
        }, $careOfOptions);
        
        Response::success($careOfOptions);
        
    } catch (Exception $e) {
        error_log("Error fetching care-of options: " . $e->getMessage());
        Response::error('Failed to fetch care-of options', 500);
    }

} elseif ($method === 'POST') {
    // Create user's own care-of option
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || empty($input['name'])) {
            Response::error('Name is required', 400);
        }
        
        $name = Validator::sanitize($input['name']);
        
        // Check duplicate within user's own options only
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE LOWER(name) = LOWER(?) AND created_by = ?");
        $stmt->execute([$name, $userId]);
        if ($stmt->fetch()) {
            Response::error('Care-of option already exists', 409);
        }
        
        $stmt = $db->prepare("INSERT INTO care_of_options (name, is_active, created_by) VALUES (?, 1, ?)");
        $stmt->execute([$name, $userId]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success([
            'id' => (int)$id, 
            'name' => $name, 
            'isActive' => true, 
            'isDefault' => false
        ], 'Care-of option created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating care-of option: " . $e->getMessage());
        Response::error('Failed to create care-of option', 500);
    }

} elseif ($method === 'PUT') {
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
        
        // Check exists and ownership — must be user's own option
        $stmt = $db->prepare("SELECT id, name, created_by FROM care_of_options WHERE id = ? AND created_by = ?");
        $stmt->execute([(int)$id, $userId]);
        $option = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$option) {
            Response::error('Care-of option not found or access denied', 404);
        }
        
        // Check duplicate within user's options (excluding current)
        $stmt = $db->prepare("SELECT id FROM care_of_options WHERE LOWER(name) = LOWER(?) AND id != ? AND created_by = ?");
        $stmt->execute([$name, (int)$id, $userId]);
        if ($stmt->fetch()) {
            Response::error('Care-of option name already exists', 409);
        }
        
        $stmt = $db->prepare("UPDATE care_of_options SET name = ? WHERE id = ? AND created_by = ?");
        $stmt->execute([$name, (int)$id, $userId]);
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Care-of option updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating care-of option: " . $e->getMessage());
        Response::error('Failed to update care-of option', 500);
    }

} elseif ($method === 'DELETE') {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        // Check exists and ownership — must be user's own option
        $stmt = $db->prepare("SELECT id, name, created_by FROM care_of_options WHERE id = ? AND created_by = ?");
        $stmt->execute([(int)$id, $userId]);
        $option = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$option) {
            Response::error('Care-of option not found or access denied', 404);
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
        
        $stmt = $db->prepare("DELETE FROM care_of_options WHERE id = ? AND created_by = ?");
        $stmt->execute([(int)$id, $userId]);
        
        cache_forget('master_data:care_of_options_active');
        
        Response::success(null, 'Care-of option deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting care-of option: " . $e->getMessage());
        Response::error('Failed to delete care-of option', 500);
    }

} elseif ($method === 'PATCH') {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        $action = $_GET['action'] ?? null;
        
        // Check exists and ownership — must be user's own option
        $stmt = $db->prepare("SELECT id, name, is_active, is_default, created_by FROM care_of_options WHERE id = ? AND created_by = ?");
        $stmt->execute([(int)$id, $userId]);
        $careOfOption = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$careOfOption) {
            Response::error('Care-of option not found or access denied', 404);
        }
        
        if ($action === 'set-default') {
            if (!$careOfOption['is_active']) {
                Response::error('Cannot set a disabled item as default', 400);
            }
            
            // Reset default only within user's own options
            $stmt2 = $db->prepare("UPDATE care_of_options SET is_default = 0 WHERE created_by = ?");
            $stmt2->execute([$userId]);
            
            $stmt = $db->prepare("UPDATE care_of_options SET is_default = 1 WHERE id = ? AND created_by = ?");
            $stmt->execute([(int)$id, $userId]);
            
            cache_forget('master_data:care_of_options_active');
            
            Response::success([
                'id' => (int)$id,
                'name' => $careOfOption['name'],
                'isActive' => (bool)$careOfOption['is_active'],
                'isDefault' => true
            ], 'Default care-of option set successfully');
        } else {
            $newStatus = $careOfOption['is_active'] ? 0 : 1;
            $newDefault = $careOfOption['is_default'];
            if (!$newStatus && $careOfOption['is_default']) {
                $newDefault = 0;
            }
            
            $stmt = $db->prepare("UPDATE care_of_options SET is_active = ?, is_default = ? WHERE id = ? AND created_by = ?");
            $stmt->execute([$newStatus, $newDefault, (int)$id, $userId]);
            
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

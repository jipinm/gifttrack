<?php
/**
 * Master Data - Invitation Status
 * GET    /api/master/invitation-status.php             - List all invitation statuses (active only by default)
 * GET    /api/master/invitation-status.php?all=1       - List all invitation statuses including inactive (Super Admin)
 * POST   /api/master/invitation-status.php             - Create invitation status (Super Admin)
 * PUT    /api/master/invitation-status.php?id={id}     - Update invitation status (Super Admin)
 * PATCH  /api/master/invitation-status.php?id={id}     - Toggle active status (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
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
            
            $stmt = $db->query("SELECT id, name, is_active, is_default FROM invitation_status ORDER BY id ASC");
            $invitationStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $invitationStatus = array_map(function($item) {
                $item['isActive'] = (bool)$item['is_active'];
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_active'], $item['is_default']);
                return $item;
            }, $invitationStatus);
            
            Response::success($invitationStatus);
            exit;
        }
        
        $cacheKey = 'master_data:invitation_status_active';
        
        $invitationStatus = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name, is_default FROM invitation_status WHERE is_active = 1 ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function($item) {
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_default']);
                return $item;
            }, $rows);
        }, 86400);
        
        header('Cache-Control: public, max-age=86400');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
        
        Response::success($invitationStatus);
        
    } catch (Exception $e) {
        error_log("Error fetching invitation status: " . $e->getMessage());
        Response::error('Failed to fetch invitation status', 500);
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
        $stmt = $db->prepare("SELECT id FROM invitation_status WHERE LOWER(name) = LOWER(?)");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Invitation status already exists', 409);
        }
        
        $stmt = $db->prepare("INSERT INTO invitation_status (name, is_active) VALUES (?, 1)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:invitation_status_active');
        
        Response::success(['id' => (int)$id, 'name' => $name, 'isActive' => true, 'isDefault' => false], 'Invitation status created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating invitation status: " . $e->getMessage());
        Response::error('Failed to create invitation status', 500);
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
        $stmt = $db->prepare("SELECT id FROM invitation_status WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Invitation status not found', 404);
        }
        
        // Check duplicate (excluding current)
        $stmt = $db->prepare("SELECT id FROM invitation_status WHERE LOWER(name) = LOWER(?) AND id != ?");
        $stmt->execute([$name, (int)$id]);
        if ($stmt->fetch()) {
            Response::error('Invitation status name already exists', 409);
        }
        
        $stmt = $db->prepare("UPDATE invitation_status SET name = ? WHERE id = ?");
        $stmt->execute([$name, (int)$id]);
        
        cache_forget('master_data:invitation_status_active');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Invitation status updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating invitation status: " . $e->getMessage());
        Response::error('Failed to update invitation status', 500);
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
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM invitation_status WHERE id = ?");
            $stmt->execute([(int)$id]);
            $invitationStatus = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invitationStatus) {
                Response::error('Invitation status not found', 404);
            }
            
            if (!$invitationStatus['is_active']) {
                Response::error('Cannot set a disabled item as default', 400);
            }
            
            $db->exec("UPDATE invitation_status SET is_default = 0");
            $stmt = $db->prepare("UPDATE invitation_status SET is_default = 1 WHERE id = ?");
            $stmt->execute([(int)$id]);
            
            cache_forget('master_data:invitation_status_active');
            
            Response::success([
                'id' => (int)$id,
                'name' => $invitationStatus['name'],
                'isActive' => (bool)$invitationStatus['is_active'],
                'isDefault' => true
            ], 'Default invitation status set successfully');
        } else {
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM invitation_status WHERE id = ?");
            $stmt->execute([(int)$id]);
            $invitationStatus = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invitationStatus) {
                Response::error('Invitation status not found', 404);
            }
            
            $newStatus = $invitationStatus['is_active'] ? 0 : 1;
            $newDefault = $invitationStatus['is_default'];
            if (!$newStatus && $invitationStatus['is_default']) {
                $newDefault = 0;
            }
            
            $stmt = $db->prepare("UPDATE invitation_status SET is_active = ?, is_default = ? WHERE id = ?");
            $stmt->execute([$newStatus, $newDefault, (int)$id]);
            
            cache_forget('master_data:invitation_status_active');
            
            $statusText = $newStatus ? 'enabled' : 'disabled';
            Response::success([
                'id' => (int)$id, 
                'name' => $invitationStatus['name'], 
                'isActive' => (bool)$newStatus,
                'isDefault' => (bool)$newDefault
            ], "Invitation status {$statusText} successfully");
        }
        
    } catch (Exception $e) {
        error_log("Error toggling invitation status: " . $e->getMessage());
        Response::error('Failed to toggle invitation status', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

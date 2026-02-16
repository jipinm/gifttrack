<?php
/**
 * Master Data - Event Types
 * GET    /api/master/event-types.php             - List all event types (active only by default)
 * GET    /api/master/event-types.php?all=1       - List all event types including inactive (Super Admin)
 * POST   /api/master/event-types.php             - Create event type (Super Admin)
 * PUT    /api/master/event-types.php?id={id}     - Update event type (Super Admin)
 * PATCH  /api/master/event-types.php?id={id}     - Toggle active status (Super Admin)
 * DELETE /api/master/event-types.php?id={id}     - Delete event type (Super Admin)
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
            // Super Admin can see all records
            global $authUser;
            if (!$authUser || $authUser['role'] !== 'superadmin') {
                Response::error('Access denied', 403);
                exit;
            }
            
            $stmt = $db->query("SELECT id, name, is_active, is_default FROM event_types ORDER BY id ASC");
            $eventTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert is_active and is_default to boolean
            $eventTypes = array_map(function($item) {
                $item['isActive'] = (bool)$item['is_active'];
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_active'], $item['is_default']);
                return $item;
            }, $eventTypes);
            
            Response::success($eventTypes);
            exit;
        }
        
        // Default: return only active records (cached)
        $cacheKey = 'master_data:event_types_active';
        
        $eventTypes = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name, is_default FROM event_types WHERE is_active = 1 ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function($item) {
                $item['isDefault'] = (bool)$item['is_default'];
                unset($item['is_default']);
                return $item;
            }, $rows);
        }, 86400);
        
        header('Cache-Control: public, max-age=86400');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
        
        Response::success($eventTypes);
        
    } catch (Exception $e) {
        error_log("Error fetching event types: " . $e->getMessage());
        Response::error('Failed to fetch event types', 500);
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
        $stmt = $db->prepare("SELECT id FROM event_types WHERE LOWER(name) = LOWER(?)");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            Response::error('Event type already exists', 409);
        }
        
        $stmt = $db->prepare("INSERT INTO event_types (name, is_active) VALUES (?, 1)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        // Clear cache
        cache_forget('master_data:event_types_active');
        
        Response::success(['id' => (int)$id, 'name' => $name, 'isActive' => true, 'isDefault' => false], 'Event type created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating event type: " . $e->getMessage());
        Response::error('Failed to create event type', 500);
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
        $stmt = $db->prepare("SELECT id FROM event_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Event type not found', 404);
        }
        
        // Check duplicate (excluding current)
        $stmt = $db->prepare("SELECT id FROM event_types WHERE LOWER(name) = LOWER(?) AND id != ?");
        $stmt->execute([$name, (int)$id]);
        if ($stmt->fetch()) {
            Response::error('Event type name already exists', 409);
        }
        
        $stmt = $db->prepare("UPDATE event_types SET name = ? WHERE id = ?");
        $stmt->execute([$name, (int)$id]);
        
        cache_forget('master_data:event_types_active');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Event type updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating event type: " . $e->getMessage());
        Response::error('Failed to update event type', 500);
    }

} elseif ($method === 'DELETE') {
    requireSuperAdmin();
    
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID is required', 400);
        }
        
        // Check exists
        $stmt = $db->prepare("SELECT id FROM event_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        if (!$stmt->fetch()) {
            Response::error('Event type not found', 404);
        }
        
        // Check if in use
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM events WHERE event_type_id = ?");
        $stmt->execute([(int)$id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($count > 0) {
            Response::error(
                "You cannot delete this event type because it is being used by {$count} event(s). Please remove or change the event type in those events first, or disable it instead of deleting.",
                409
            );
        }
        
        $stmt = $db->prepare("DELETE FROM event_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:event_types_active');
        
        Response::success(null, 'Event type deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting event type: " . $e->getMessage());
        Response::error('Failed to delete event type', 500);
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
            // Set this item as default (clear others first)
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM event_types WHERE id = ?");
            $stmt->execute([(int)$id]);
            $eventType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$eventType) {
                Response::error('Event type not found', 404);
            }
            
            if (!$eventType['is_active']) {
                Response::error('Cannot set a disabled item as default', 400);
            }
            
            // Clear all defaults, then set the new one
            $db->exec("UPDATE event_types SET is_default = 0");
            $stmt = $db->prepare("UPDATE event_types SET is_default = 1 WHERE id = ?");
            $stmt->execute([(int)$id]);
            
            cache_forget('master_data:event_types_active');
            
            Response::success([
                'id' => (int)$id,
                'name' => $eventType['name'],
                'isActive' => (bool)$eventType['is_active'],
                'isDefault' => true
            ], 'Default event type set successfully');
        } else {
            // Toggle active status (Enable/Disable)
            $stmt = $db->prepare("SELECT id, name, is_active, is_default FROM event_types WHERE id = ?");
            $stmt->execute([(int)$id]);
            $eventType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$eventType) {
                Response::error('Event type not found', 404);
            }
            
            $newStatus = $eventType['is_active'] ? 0 : 1;
            
            // If disabling and it's the default, clear default too
            $newDefault = $eventType['is_default'];
            if (!$newStatus && $eventType['is_default']) {
                $newDefault = 0;
            }
            
            $stmt = $db->prepare("UPDATE event_types SET is_active = ?, is_default = ? WHERE id = ?");
            $stmt->execute([$newStatus, $newDefault, (int)$id]);
            
            cache_forget('master_data:event_types_active');
            
            $statusText = $newStatus ? 'enabled' : 'disabled';
            Response::success([
                'id' => (int)$id, 
                'name' => $eventType['name'], 
                'isActive' => (bool)$newStatus,
                'isDefault' => (bool)$newDefault
            ], "Event type {$statusText} successfully");
        }
        
    } catch (Exception $e) {
        error_log("Error toggling event type status: " . $e->getMessage());
        Response::error('Failed to toggle event type status', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

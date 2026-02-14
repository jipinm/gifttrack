<?php
/**
 * Master Data - Event Types
 * GET    /api/master/event-types.php         - List all event types
 * POST   /api/master/event-types.php         - Create event type (Super Admin)
 * PUT    /api/master/event-types.php?id={id} - Update event type (Super Admin)
 * DELETE /api/master/event-types.php?id={id} - Delete event type (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

if ($method === 'GET') {
    try {
        $cacheKey = 'master_data:event_types';
        
        $eventTypes = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name FROM event_types ORDER BY id ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        
        $stmt = $db->prepare("INSERT INTO event_types (name) VALUES (?)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        // Clear cache
        cache_forget('master_data:event_types');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Event type created successfully', 201);
        
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
        
        cache_forget('master_data:event_types');
        
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
            Response::error("Cannot delete: event type is used by {$count} event(s)", 409);
        }
        
        $stmt = $db->prepare("DELETE FROM event_types WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:event_types');
        
        Response::success(null, 'Event type deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting event type: " . $e->getMessage());
        Response::error('Failed to delete event type', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

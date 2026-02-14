<?php
/**
 * Master Data - Care Of Options
 * GET    /api/master/care-of-options.php         - List all care-of options
 * POST   /api/master/care-of-options.php         - Create care-of option (Super Admin)
 * PUT    /api/master/care-of-options.php?id={id} - Update care-of option (Super Admin)
 * DELETE /api/master/care-of-options.php?id={id} - Delete care-of option (Super Admin)
 */
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

if ($method === 'GET') {
    try {
        $cacheKey = 'master_data:care_of_options';
        
        $careOfOptions = cache_remember($cacheKey, function() use ($db) {
            $stmt = $db->query("SELECT id, name FROM care_of_options ORDER BY id ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        
        $stmt = $db->prepare("INSERT INTO care_of_options (name) VALUES (?)");
        $stmt->execute([$name]);
        $id = $db->lastInsertId();
        
        cache_forget('master_data:care_of_options');
        
        Response::success(['id' => (int)$id, 'name' => $name], 'Care-of option created successfully', 201);
        
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
        
        cache_forget('master_data:care_of_options');
        
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
            Response::error("Cannot delete: care-of option is used by {$count} attachment(s)", 409);
        }
        
        $stmt = $db->prepare("DELETE FROM care_of_options WHERE id = ?");
        $stmt->execute([(int)$id]);
        
        cache_forget('master_data:care_of_options');
        
        Response::success(null, 'Care-of option deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting care-of option: " . $e->getMessage());
        Response::error('Failed to delete care-of option', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}

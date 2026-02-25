<?php
/**
 * Event Show Endpoint
 * GET /api/events/show?id=X - Get event details with attached customers
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Event.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'GET') {
    Response::methodNotAllowed();
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    Response::validationError(['id' => 'Event ID is required']);
    exit;
}

$eventModel = new Event();
$event = $eventModel->getById($id);

if (!$event) {
    Response::notFound('Event not found');
    exit;
}

// Role-based access check: Admin can only view own events + superadmin-created events
if ($authUser['role'] !== 'superadmin') {
    $createdBy = $event['created_by'];
    if ($createdBy !== $authUser['id']) {
        // Check if event was created by a superadmin
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$createdBy]);
        $creator = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$creator || $creator['role'] !== 'superadmin') {
            Response::forbidden('You do not have access to this event');
            exit;
        }
    }
}

Response::success($eventModel->formatForResponse($event));

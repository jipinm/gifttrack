<?php
/**
 * Event Delete Endpoint
 * DELETE /api/events/delete?id=X - Delete event (Super Admin only)
 * Cascade deletes: event_customers and gifts
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../models/Event.php';

requireSuperAdmin();

global $authUser;

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'DELETE') {
    Response::methodNotAllowed();
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    Response::validationError(['id' => 'Event ID is required']);
    exit;
}

$eventModel = new Event();

if (!$eventModel->exists($id)) {
    Response::notFound('Event not found');
    exit;
}

// Check for related gifts
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM gifts WHERE event_id = ?");
$stmt->execute([$id]);
$giftCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
if ($giftCount > 0) {
    Response::error(
        "You cannot delete this event because {$giftCount} gift(s) are linked to it. Please delete the related gifts first before deleting this event.",
        409
    );
    exit;
}

// Check for attached customers
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM event_customers WHERE event_id = ?");
$stmt->execute([$id]);
$customerCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
if ($customerCount > 0) {
    Response::error(
        "You cannot delete this event because {$customerCount} customer(s) are attached to it. Please detach all customers first before deleting this event.",
        409
    );
    exit;
}

// Safe to delete - no related data exists
$success = $eventModel->delete($id);

if (!$success) {
    Response::serverError('Failed to delete event');
    exit;
}

Response::success(null, 'Event deleted successfully');

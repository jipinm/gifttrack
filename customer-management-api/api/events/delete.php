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

$success = $eventModel->delete($id);

if (!$success) {
    Response::serverError('Failed to delete event');
    exit;
}

Response::success(null, 'Event deleted successfully');

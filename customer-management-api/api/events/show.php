<?php
/**
 * Event Show Endpoint
 * GET /api/events/show?id=X - Get event details with attached customers
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Event.php';

global $authUser;

$method = $_SERVER['REQUEST_METHOD'];

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

Response::success($eventModel->formatForResponse($event));

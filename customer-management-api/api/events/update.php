<?php
/**
 * Event Update Endpoint
 * PUT /api/events/update?id=X - Update event
 * - Super Admin can update any event
 * - Admin can update only events they created
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Event.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'PUT') {
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

// Ownership check: Admin can only update their own events
if ($authUser['role'] !== 'superadmin') {
    $createdBy = $eventModel->getCreatedBy($id);
    if ($createdBy !== $authUser['id']) {
        Response::forbidden('You can only edit events you created');
    }
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    Response::validationError(['message' => 'Invalid JSON data']);
    exit;
}

// Validate fields if provided
$updateData = [];

if (isset($data['name'])) {
    if (empty(trim($data['name']))) {
        Response::validationError(['name' => 'Event name cannot be empty']);
        exit;
    }
    $updateData['name'] = Validator::sanitize($data['name']);
}

if (isset($data['eventDate'])) {
    $validator = new Validator();
    $validator->date('eventDate', $data['eventDate']);
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
        exit;
    }
    $updateData['eventDate'] = $data['eventDate'];
}

if (isset($data['eventTypeId'])) {
    $updateData['eventTypeId'] = (int)$data['eventTypeId'];
}

if (isset($data['eventCategory'])) {
    $validCategories = ['self_event', 'customer_event'];
    if (!in_array($data['eventCategory'], $validCategories)) {
        Response::validationError(['eventCategory' => 'Must be self_event or customer_event']);
        exit;
    }
    $updateData['eventCategory'] = $data['eventCategory'];
}

if (array_key_exists('notes', $data)) {
    $updateData['notes'] = $data['notes'] ? Validator::sanitize($data['notes']) : null;
}

if (empty($updateData)) {
    Response::validationError(['message' => 'At least one field is required for update']);
    exit;
}

$success = $eventModel->update($id, $updateData);

if (!$success) {
    Response::serverError('Failed to update event');
    exit;
}

$event = $eventModel->getById($id);
Response::success($eventModel->formatForResponse($event), 'Event updated successfully');

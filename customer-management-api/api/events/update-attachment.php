<?php
/**
 * Update Event-Customer Attachment Endpoint
 * PUT /api/events/update-attachment?id=X - Update attachment (invitation status, care of)
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/EventCustomer.php';
require_once __DIR__ . '/../../models/Event.php';

global $authUser;

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'PUT') {
    Response::methodNotAllowed();
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    Response::validationError(['id' => 'Attachment ID is required']);
    exit;
}

$ecModel = new EventCustomer();

// Check ownership: admin can only update attachments for their own customers
$adminId = ($authUser['role'] === 'superadmin') ? null : $authUser['id'];
if (!$ecModel->exists($id, $adminId)) {
    Response::notFound('Attachment not found or access denied');
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    Response::validationError(['message' => 'Invalid JSON data']);
    exit;
}

$updateData = [];

if (isset($data['invitationStatusId'])) {
    $updateData['invitationStatusId'] = (int)$data['invitationStatusId'];
}

if (array_key_exists('careOfId', $data)) {
    $updateData['careOfId'] = $data['careOfId'] ? (int)$data['careOfId'] : null;
}

if (empty($updateData)) {
    Response::validationError(['message' => 'At least one field is required for update']);
    exit;
}

$success = $ecModel->update($id, $updateData);

if (!$success) {
    Response::serverError('Failed to update attachment');
    exit;
}

$attachment = $ecModel->getById($id);
$eventModel = new Event();
$eventCategory = $eventModel->getCategory($attachment['event_id']);

Response::success($ecModel->formatForResponse($attachment, $eventCategory), 'Attachment updated successfully');

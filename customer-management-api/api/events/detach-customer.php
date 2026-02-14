<?php
/**
 * Detach Customer from Event Endpoint
 * DELETE /api/events/detach-customer?id=X - Detach customer (also deletes related gifts)
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/EventCustomer.php';

global $authUser;

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'DELETE') {
    Response::methodNotAllowed();
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    Response::validationError(['id' => 'Attachment ID is required']);
    exit;
}

$ecModel = new EventCustomer();

// Check ownership: admin can only detach their own customers
$adminId = ($authUser['role'] === 'superadmin') ? null : $authUser['id'];
if (!$ecModel->exists($id, $adminId)) {
    Response::notFound('Attachment not found or access denied');
    exit;
}

$success = $ecModel->detach($id);

if (!$success) {
    Response::serverError('Failed to detach customer from event');
    exit;
}

Response::success(null, 'Customer detached from event successfully');

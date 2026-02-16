<?php
/**
 * Detach Customer from Event Endpoint
 * DELETE /api/events/detach-customer?id=X - Detach customer (also deletes related gifts)
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/EventCustomer.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);

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

// Check for related gifts before detaching
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare(
    "SELECT ec.event_id, ec.customer_id, c.name as customer_name 
     FROM event_customers ec 
     JOIN customers c ON ec.customer_id = c.id 
     WHERE ec.id = ?"
);
$stmt->execute([$id]);
$attachment = $stmt->fetch(PDO::FETCH_ASSOC);

if ($attachment) {
    $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM gifts WHERE event_id = ? AND customer_id = ?");
    $stmt->execute([$attachment['event_id'], $attachment['customer_id']]);
    $giftCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    if ($giftCount > 0) {
        $customerName = $attachment['customer_name'];
        Response::error(
            "You cannot detach {$customerName} because {$giftCount} gift(s) are linked to this customer for this event. Please delete the related gifts first before detaching.",
            409
        );
        exit;
    }
}

$success = $ecModel->detach($id);

if (!$success) {
    Response::serverError('Failed to detach customer from event');
    exit;
}

Response::success(null, 'Customer detached from event successfully');

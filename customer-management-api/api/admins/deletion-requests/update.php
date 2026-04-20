<?php
/**
 * Deletion Requests API - Update Endpoint
 * PUT /api/admins/deletion-requests/update.php?id={requestId}
 *
 * Super Admin only: Approve or reject an admin deletion request.
 *
 * Request body:
 *   { "action": "approve" | "reject" }
 *
 * On approval: the admin account is deleted immediately.
 * On rejection: the request status is set to rejected; account remains active.
 */

require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../middleware/auth.php';
require_once __DIR__ . '/../../../middleware/role.php';
require_once __DIR__ . '/../../../models/User.php';

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'PUT') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;

    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }

    if ($authUser['role'] !== 'superadmin') {
        Response::error('Access denied. Super Admin role required.', 403);
    }

    // Get request ID from query string
    if (empty($_GET['id'])) {
        Response::error('Request ID is required.', 400);
    }

    $requestId = (int)$_GET['id'];

    // Parse request body
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['action']) || !in_array($input['action'], ['approve', 'reject'], true)) {
        Response::error('Invalid action. Must be "approve" or "reject".', 400);
    }

    $action = $input['action'];

    $userModel = new User();

    // Verify request exists
    $request = $userModel->getDeletionRequestById($requestId);
    if (!$request) {
        Response::error('Deletion request not found.', 404);
    }

    // Only pending requests can be acted upon
    if ($request['status'] !== 'pending') {
        Response::error('This request has already been ' . $request['status'] . '.', 409);
    }

    if ($action === 'approve') {
        $adminId = $request['admin_id'];

        // Check for customers linked to this admin
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM customers WHERE created_by = ?");
        $stmt->execute([$adminId]);
        $customerCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($customerCount > 0) {
            Response::error(
                "Cannot approve: {$customerCount} customer(s) are associated with this admin account. Please reassign or delete those customers first.",
                409
            );
        }

        // Check for events created by this admin
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM events WHERE created_by = ?");
        $stmt->execute([$adminId]);
        $eventCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($eventCount > 0) {
            Response::error(
                "Cannot approve: {$eventCount} event(s) are associated with this admin account. Please delete those events first.",
                409
            );
        }

        // Mark request as approved
        $userModel->updateDeletionRequestStatus($requestId, 'approved');

        // Delete the admin account
        $deleted = $userModel->delete($adminId);
        if (!$deleted) {
            // Revert status so it can be retried
            $userModel->updateDeletionRequestStatus($requestId, 'pending');
            Response::error('Failed to delete the admin account. Please try again.', 500);
        }

        Response::success(
            ['requestId' => $requestId, 'adminId' => $adminId, 'action' => 'approved'],
            'Deletion request approved. Admin account has been deleted.',
            200
        );

    } else {
        // Reject
        $userModel->updateDeletionRequestStatus($requestId, 'rejected');

        $updated = $userModel->getDeletionRequestById($requestId);

        Response::success(
            $userModel->formatDeletionRequestForResponse($updated),
            'Deletion request rejected. Admin account remains active.',
            200
        );
    }

} catch (Exception $e) {
    error_log("Error in deletion-requests/update.php: " . $e->getMessage());
    Response::error('An error occurred while processing the deletion request.', 500);
}

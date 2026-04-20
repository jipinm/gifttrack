<?php
/**
 * Admin Registration Requests — Approve / Reject Endpoint  (Super Admin only)
 * PUT /api/admins/registration-requests/update?id={userId}
 *
 * Body: { "action": "approve" | "reject" }
 */

require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../middleware/auth.php';
require_once __DIR__ . '/../../../middleware/role.php';
require_once __DIR__ . '/../../../models/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;

    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }

    if ($authUser['role'] !== 'superadmin') {
        Response::error('Access denied. Super admin role required.', 403);
    }

    // Target admin user ID from query string
    $userId = isset($_GET['id']) ? trim($_GET['id']) : null;
    if (empty($userId)) {
        Response::error('Admin user ID is required', 400);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
        Response::error('Invalid JSON input', 400);
    }

    $action = isset($input['action']) ? trim($input['action']) : '';
    if (!in_array($action, ['approve', 'reject'], true)) {
        Response::error('Invalid action. Must be "approve" or "reject".', 400, [
            'action' => 'Valid values: approve, reject'
        ]);
    }

    $newStatus = ($action === 'approve') ? 'approved' : 'rejected';

    $userModel = new User();

    // Verify the target user exists and is a pending/rejected admin
    $targetUser = $userModel->getById($userId);
    if (!$targetUser || $targetUser['role'] !== 'admin') {
        Response::error('Admin not found', 404);
    }

    // Prevent acting on already-processed requests if desired (optional guard)
    // Currently we allow re-approval / re-rejection for flexibility.

    $success = $userModel->updateRegistrationStatus($userId, $newStatus);
    if (!$success) {
        Response::error('Failed to update registration status. Please try again.', 500);
    }

    // Return the updated admin record
    $updated = $userModel->getById($userId);
    $formatted = $userModel->formatForResponse($updated);

    $message = ($newStatus === 'approved')
        ? 'Admin registration approved. The admin can now log in.'
        : 'Admin registration rejected. The admin cannot log in.';

    Response::success($formatted, $message, 200);

} catch (Exception $e) {
    error_log('Error in registration-requests/update: ' . $e->getMessage());
    Response::error('An error occurred while processing the registration request.', 500);
}

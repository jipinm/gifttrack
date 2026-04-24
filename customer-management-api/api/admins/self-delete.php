<?php
/**
 * Admins API - Self Delete Endpoint
 * DELETE /api/admins/self-delete.php
 *
 * Allows a Super Admin to permanently delete their own account.
 * No approval queue — the deletion is immediate.
 * The client must call the logout endpoint separately after this succeeds.
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;

    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }

    if ($authUser['role'] !== 'superadmin') {
        Response::error('Access denied. This endpoint is for Super Admin accounts only.', 403);
    }

    $userModel = new User();

    $deleted = $userModel->delete($authUser['id']);

    if (!$deleted) {
        Response::error('Failed to delete account. Please try again.', 500);
    }

    Response::success(
        ['userId' => $authUser['id']],
        'Your account has been permanently deleted.',
        200
    );

} catch (Exception $e) {
    error_log("Error in admins/self-delete.php: " . $e->getMessage());
    Response::error('An error occurred while deleting the account.', 500);
}

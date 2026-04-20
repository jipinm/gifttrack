<?php
/**
 * Deletion Requests API - Index Endpoint
 * GET /api/admins/deletion-requests/index.php
 * GET /api/admins/deletion-requests/index.php?status=pending
 * GET /api/admins/deletion-requests/index.php?status=approved
 * GET /api/admins/deletion-requests/index.php?status=rejected
 *
 * Super Admin only: List all admin deletion requests, optionally filtered by status.
 */

require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../middleware/auth.php';
require_once __DIR__ . '/../../../middleware/role.php';
require_once __DIR__ . '/../../../models/User.php';

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'GET') {
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

    // Optional status filter
    $status = null;
    if (isset($_GET['status']) && in_array($_GET['status'], ['pending', 'approved', 'rejected'], true)) {
        $status = $_GET['status'];
    }

    $userModel = new User();
    $requests = $userModel->getDeletionRequests($status);

    $formatted = array_map(function ($r) use ($userModel) {
        return $userModel->formatDeletionRequestForResponse($r);
    }, $requests);

    Response::success($formatted, 'Deletion requests retrieved successfully', 200);

} catch (Exception $e) {
    error_log("Error in deletion-requests/index.php: " . $e->getMessage());
    Response::error('An error occurred while retrieving deletion requests.', 500);
}

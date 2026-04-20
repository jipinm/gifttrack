<?php
/**
 * Admin Registration Requests — List Endpoint  (Super Admin only)
 * GET /api/admins/registration-requests/index
 *
 * Query params:
 *   ?status=pending|approved|rejected   (optional, defaults to 'pending')
 */

require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../middleware/auth.php';
require_once __DIR__ . '/../../../middleware/role.php';
require_once __DIR__ . '/../../../models/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

    // Optional status filter; default to 'pending'
    $allowedStatuses = ['pending', 'approved', 'rejected'];
    $status = isset($_GET['status']) && in_array($_GET['status'], $allowedStatuses, true)
        ? $_GET['status']
        : null;

    // If caller explicitly passes ?status=all, return everything
    if (isset($_GET['status']) && $_GET['status'] === 'all') {
        $status = null;
    }

    $userModel = new User();
    $requests = $userModel->getRegistrationRequests($status);

    $formatted = array_map(function ($u) use ($userModel) {
        return $userModel->formatForResponse($u);
    }, $requests);

    Response::success($formatted, 'Registration requests retrieved successfully', 200);

} catch (Exception $e) {
    error_log('Error in registration-requests/index: ' . $e->getMessage());
    Response::error('An error occurred while retrieving registration requests.', 500);
}

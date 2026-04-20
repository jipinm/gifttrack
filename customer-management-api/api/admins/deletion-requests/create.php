<?php
/**
 * Deletion Requests API - Create Endpoint
 * POST /api/admins/deletion-requests/create.php
 *
 * Admin submits an account deletion request.
 * Admin role only. A pending request cannot be submitted twice.
 */

require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../middleware/auth.php';
require_once __DIR__ . '/../../../models/User.php';

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;

    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }

    // Only admins (not superadmin) can request deletion
    if ($authUser['role'] !== 'admin') {
        Response::error('Only admin accounts can submit a deletion request.', 403);
    }

    $userModel = new User();

    // Prevent duplicate pending requests
    if ($userModel->hasPendingDeletionRequest($authUser['id'])) {
        Response::error('You already have a pending deletion request. Please wait for the Super Admin to review it.', 409);
    }

    $requestId = $userModel->createDeletionRequest($authUser['id']);

    if (!$requestId) {
        Response::error('Failed to submit deletion request. Please try again.', 500);
    }

    $request = $userModel->getDeletionRequestById($requestId);

    Response::success(
        $userModel->formatDeletionRequestForResponse($request),
        'Your account deletion request has been submitted and is pending Super Admin review.',
        201
    );

} catch (Exception $e) {
    error_log("Error in deletion-requests/create.php: " . $e->getMessage());
    Response::error('An error occurred while submitting the deletion request.', 500);
}

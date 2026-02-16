<?php
/**
 * Gift API - Delete Endpoint
 * DELETE /api/gifts/delete.php?id={giftId}
 * 
 * Delete a gift
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load models
require_once __DIR__ . '/../../models/Gift.php';

// Handle DELETE request
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'DELETE') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;
    
    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }
    
    // Get gift ID from query parameter
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        Response::error('Gift ID is required', 400);
    }
    
    $giftId = $_GET['id'];
    
    // Verify gift exists
    $giftModel = new Gift();
    
    // Admin-scoped access: Regular admins can only delete gifts for their own customers
    $adminIdFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
    
    if (!$giftModel->exists($giftId, $adminIdFilter)) {
        Response::error('Gift not found', 404);
    }
    
    // Delete gift (this also returns the customer_id)
    $customerId = $giftModel->delete($giftId);
    
    if (!$customerId) {
        Response::error('Failed to delete gift', 500);
    }
    
    // Return success response
    Response::success([
        'deleted' => true,
        'giftId' => $giftId,
        'customerId' => $customerId
    ], 'Gift deleted successfully', 200);
    
} catch (Exception $e) {
    error_log("Error in delete gift endpoint: " . $e->getMessage());
    Response::error('An error occurred while deleting the gift', 500);
}

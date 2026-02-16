<?php
/**
 * Gift API - Update Endpoint
 * PUT /api/gifts/update.php?id={giftId}
 * 
 * Update an existing gift
 * Note: Event date and type are now on the event, not the gift
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load models
require_once __DIR__ . '/../../models/Gift.php';

// Handle PUT request
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'PUT') {
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
    
    // Admin-scoped access: Regular admins can only update gifts for their own customers
    $adminIdFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
    
    if (!$giftModel->exists($giftId, $adminIdFilter)) {
        Response::error('Gift not found', 404);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Validate input fields
    $errors = [];
    $updateData = [];
    
    if (isset($input['giftTypeId'])) {
        if (empty($input['giftTypeId'])) {
            $errors['giftTypeId'] = 'Gift type cannot be empty';
        } else {
            $updateData['gift_type_id'] = (int)$input['giftTypeId'];
        }
    }
    
    if (isset($input['value'])) {
        if (!is_numeric($input['value'])) {
            $errors['value'] = 'Gift value must be a number';
        } elseif ($input['value'] < 0) {
            $errors['value'] = 'Gift value must be a positive number';
        } else {
            $updateData['value'] = (float)$input['value'];
        }
    }
    
    if (isset($input['description'])) {
        $updateData['description'] = $input['description'];
    }
    
    if (!empty($errors)) {
        Response::error('Validation failed', 400, $errors);
    }
    
    if (empty($updateData)) {
        Response::error('No fields to update', 400);
    }
    
    // Update gift
    $result = $giftModel->update($giftId, $updateData);
    
    if (!$result) {
        Response::error('Failed to update gift', 500);
    }
    
    // Get updated gift with all details
    $gift = $giftModel->getById($giftId);
    $formattedGift = $giftModel->formatForResponse($gift);
    
    // Return success response
    Response::success($formattedGift, 'Gift updated successfully', 200);
    
} catch (Exception $e) {
    error_log("Error in update gift endpoint: " . $e->getMessage());
    Response::error('An error occurred while updating the gift', 500);
}

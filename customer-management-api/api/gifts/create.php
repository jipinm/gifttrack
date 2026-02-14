<?php
/**
 * Gift API - Create Endpoint
 * POST /api/gifts/create.php
 * 
 * Create a new gift for an event-customer combination
 * Gift direction is derived from event category:
 *   self_event → received, customer_event → given
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load models
require_once __DIR__ . '/../../models/Gift.php';
require_once __DIR__ . '/../../models/Event.php';
require_once __DIR__ . '/../../models/EventCustomer.php';
require_once __DIR__ . '/../../models/Customer.php';

// Handle POST request
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    global $authUser;
    
    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Invalid JSON input', 400);
    }
    
    // Validate required fields
    $errors = [];
    
    if (!isset($input['eventId']) || empty($input['eventId'])) {
        $errors['eventId'] = 'Event ID is required';
    }
    
    if (!isset($input['customerId']) || empty($input['customerId'])) {
        $errors['customerId'] = 'Customer ID is required';
    }
    
    if (!isset($input['giftTypeId']) || empty($input['giftTypeId'])) {
        $errors['giftTypeId'] = 'Gift type is required';
    }
    
    if (!isset($input['value']) || !is_numeric($input['value'])) {
        $errors['value'] = 'Gift value is required and must be a number';
    } elseif ($input['value'] < 0) {
        $errors['value'] = 'Gift value must be a positive number';
    }
    
    if (!empty($errors)) {
        Response::error('Validation failed', 400, $errors);
    }
    
    // Verify event exists
    $eventModel = new Event();
    if (!$eventModel->exists($input['eventId'])) {
        Response::error('Event not found', 404);
    }
    
    // Verify customer exists and admin has access
    $customerModel = new Customer();
    $adminId = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
    if (!$customerModel->exists($input['customerId'], $adminId)) {
        Response::error('Customer not found or access denied', 404);
    }
    
    // Verify customer is attached to the event
    $ecModel = new EventCustomer();
    if (!$ecModel->isAttached($input['eventId'], $input['customerId'])) {
        Response::error('Customer is not attached to this event', 400);
    }
    
    // Prepare gift data
    $giftData = [
        'event_id' => $input['eventId'],
        'customer_id' => $input['customerId'],
        'gift_type_id' => (int)$input['giftTypeId'],
        'value' => (float)$input['value'],
        'description' => $input['description'] ?? null
    ];
    
    // Create gift
    $giftModel = new Gift();
    $giftId = $giftModel->create($giftData);
    
    if (!$giftId) {
        Response::error('Failed to create gift', 500);
    }
    
    // Get created gift with all details
    $gift = $giftModel->getById($giftId);
    $formattedGift = $giftModel->formatForResponse($gift);
    
    // Return success response
    Response::success($formattedGift, 'Gift created successfully', 201);
    
} catch (Exception $e) {
    error_log("Error in create gift endpoint: " . $e->getMessage());
    Response::error('An error occurred while creating the gift', 500);
}

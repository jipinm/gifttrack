<?php
/**
 * Customer Events Endpoint
 * GET /api/customers/events?customerId=X - List events a customer is attached to
 * 
 * Returns the customer's event history with gift details.
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Customer.php';
require_once __DIR__ . '/../../models/EventCustomer.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
    exit;
}

// Support both camelCase and snake_case
$customerId = $_GET['customerId'] ?? $_GET['customer_id'] ?? null;

if (!$customerId) {
    Response::validationError(['customerId' => 'Customer ID is required']);
    exit;
}

try {
    // Verify customer exists and user has access
    $customerModel = new Customer();
    $createdByFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
    $customer = $customerModel->getById($customerId, $createdByFilter);

    if (!$customer) {
        Response::notFound('Customer not found');
        exit;
    }

    $ecModel = new EventCustomer();
    $attachments = $ecModel->getByCustomerId($customerId);

    // Format each attachment for the response
    $formattedEvents = array_map(function ($att) use ($ecModel) {
        $eventCategory = $att['event_category'] ?? null;
        return $ecModel->formatForResponse($att, $eventCategory);
    }, $attachments);

    Response::success([
        'customerId' => $customerId,
        'events' => $formattedEvents,
        'count' => count($formattedEvents),
    ]);
} catch (Exception $e) {
    error_log("Customer events error: " . $e->getMessage());
    Response::error('Failed to fetch customer events', 500);
}

<?php
/**
 * Event Customer Attachment Endpoints
 * GET /api/events/customers?eventId=X - List customers attached to event
 * POST /api/events/customers - Attach customer to event
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Event.php';
require_once __DIR__ . '/../../models/EventCustomer.php';
require_once __DIR__ . '/../../models/Customer.php';

global $authUser;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // ==========================================
    // GET: List attached customers for an event
    // Super Admin sees all, Admin sees only own customers
    // ==========================================
    
    // Support both camelCase and snake_case
    $eventId = $_GET['eventId'] ?? $_GET['event_id'] ?? null;
    
    if (!$eventId) {
        Response::validationError(['eventId' => 'Event ID is required']);
        exit;
    }
    
    $eventModel = new Event();
    if (!$eventModel->exists($eventId)) {
        Response::notFound('Event not found');
        exit;
    }
    
    $ecModel = new EventCustomer();
    
    // Admin sees only their own customers' attachments
    $adminId = ($authUser['role'] === 'superadmin') ? null : $authUser['id'];
    $attachments = $ecModel->getByEventId($eventId, $adminId);
    
    $event = $eventModel->getById($eventId);
    $eventCategory = $event['event_category'] ?? null;
    
    $formattedAttachments = array_map(function($att) use ($ecModel, $eventCategory) {
        return $ecModel->formatForResponse($att, $eventCategory);
    }, $attachments);
    
    Response::success([
        'eventId' => $eventId,
        'eventCategory' => $eventCategory,
        'customers' => $formattedAttachments,
        'count' => count($formattedAttachments)
    ]);

} elseif ($method === 'POST') {
    // ==========================================
    // POST: Attach customer to event
    // Super Admin can attach any customer
    // Admin can attach only their own customers
    // ==========================================
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        Response::validationError(['message' => 'Invalid JSON data']);
        exit;
    }
    
    // Validate required fields
    $validator = new Validator();
    $validator->field('eventId', $data['eventId'] ?? '')->required();
    $validator->field('customerId', $data['customerId'] ?? '')->required();
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
        exit;
    }
    
    $eventModel = new Event();
    $ecModel = new EventCustomer();
    $customerModel = new Customer();
    
    // Check event exists
    if (!$eventModel->exists($data['eventId'])) {
        Response::notFound('Event not found');
        exit;
    }
    
    // Check customer exists and access
    $adminId = ($authUser['role'] === 'superadmin') ? null : $authUser['id'];
    if (!$customerModel->exists($data['customerId'], $adminId)) {
        Response::notFound('Customer not found or access denied');
        exit;
    }
    
    // Check if already attached
    if ($ecModel->isAttached($data['eventId'], $data['customerId'])) {
        Response::error('Customer is already attached to this event', 409);
        exit;
    }
    
    // Get event category for validation
    $eventCategory = $eventModel->getCategory($data['eventId']);
    
    // Customer Event: only ONE customer allowed
    if ($eventCategory === 'customer_event') {
        $existingCount = $ecModel->countByEvent($data['eventId']);
        if ($existingCount > 0) {
            Response::error('Customer Event can only have one customer attached', 409);
            exit;
        }
    }
    
    // Validate care_of for Self Event
    $careOfId = $data['careOfId'] ?? null;
    if ($eventCategory === 'self_event' && empty($careOfId)) {
        Response::validationError(['careOfId' => 'Care Of is required for Self Event']);
        exit;
    }
    
    // Validate invitation status
    $invitationStatusId = $data['invitationStatusId'] ?? 1; // Default: Called
    
    $attachmentData = [
        'eventId' => $data['eventId'],
        'customerId' => $data['customerId'],
        'invitationStatusId' => $invitationStatusId,
        'careOfId' => $careOfId,
        'attachedBy' => $authUser['id']
    ];
    
    $attachmentId = $ecModel->attach($attachmentData);
    
    if (!$attachmentId) {
        Response::serverError('Failed to attach customer to event');
        exit;
    }
    
    $attachment = $ecModel->getById($attachmentId);
    Response::success($ecModel->formatForResponse($attachment, $eventCategory), 'Customer attached to event successfully', 201);

} else {
    Response::methodNotAllowed();
}

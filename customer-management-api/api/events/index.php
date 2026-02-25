<?php
/**
 * Events List & Create Endpoint
 * GET /api/events - List all events (all authenticated users)
 * POST /api/events - Create new event (Super Admin only)
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Event.php';
require_once __DIR__ . '/../../utils/Paginator.php';

global $authUser;

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method === 'GET') {
    // ==========================================
    // GET: List all events
    // All authenticated users can view events
    // ==========================================
    
    $eventModel = new Event();
    
    // Build filters
    $filters = [];
    
    if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $filters['search'] = trim($_GET['search']);
    }
    
    if (isset($_GET['eventTypeId']) && !empty($_GET['eventTypeId'])) {
        $filters['eventTypeId'] = $_GET['eventTypeId'];
    }
    
    if (isset($_GET['eventCategory']) && !empty($_GET['eventCategory'])) {
        $filters['eventCategory'] = $_GET['eventCategory'];
    }
    
    if (isset($_GET['dateFrom']) && !empty($_GET['dateFrom'])) {
        $filters['dateFrom'] = $_GET['dateFrom'];
    }
    
    if (isset($_GET['dateTo']) && !empty($_GET['dateTo'])) {
        $filters['dateTo'] = $_GET['dateTo'];
    }
    
    // Time frame filter (upcoming / past) — overrides dateFrom/dateTo when set
    if (isset($_GET['timeFrame']) && !empty($_GET['timeFrame'])) {
        $timeFrame = strtolower(trim($_GET['timeFrame']));
        if (in_array($timeFrame, ['upcoming', 'past'])) {
            $filters['timeFrame'] = $timeFrame;
        }
    }
    
    // Sort order (asc / desc)
    if (isset($_GET['sortOrder']) && !empty($_GET['sortOrder'])) {
        $sortOrder = strtoupper(trim($_GET['sortOrder']));
        if (in_array($sortOrder, ['ASC', 'DESC'])) {
            $filters['sortOrder'] = $sortOrder;
        }
    }
    
    // Check for pagination
    $paginator = null;
    if (isset($_GET['page']) || isset($_GET['perPage'])) {
        require_once __DIR__ . '/../../utils/Paginator.php';
        $paginator = paginate();
    }
    
    $result = $eventModel->getAll($filters, $paginator, $authUser);
    
    if ($paginator) {
        $events = $paginator->getData();
        $formattedEvents = array_map(function($event) use ($eventModel) {
            return $eventModel->formatForResponse($event);
        }, $events);
        
        Response::success([
            'events' => $formattedEvents,
            'pagination' => $paginator->getMeta()
        ]);
    } else {
        $formattedEvents = array_map(function($event) use ($eventModel) {
            return $eventModel->formatForResponse($event);
        }, $result);
        
        Response::success([
            'events' => $formattedEvents,
            'count' => count($formattedEvents)
        ]);
    }

} elseif ($method === 'POST') {
    // ==========================================
    // POST: Create new event (Admin & Super Admin)
    // ==========================================
    
    // All authenticated users (admin or superadmin) can create events
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        Response::validationError(['message' => 'Invalid JSON data']);
        exit;
    }
    
    // Validate required fields
    $validator = new Validator();
    $validator->required('name', $data['name'] ?? '', 'Event name')
             ->maxLength('name', $data['name'] ?? '', 255, 'Event name');
    $validator->required('eventDate', $data['eventDate'] ?? '', 'Event date')
             ->date('eventDate', $data['eventDate'] ?? '');
    $validator->required('eventTypeId', $data['eventTypeId'] ?? '', 'Event type');
    
    // Validate event category
    $validCategories = ['self_event', 'customer_event'];
    $eventCategory = $data['eventCategory'] ?? 'self_event';
    if (!in_array($eventCategory, $validCategories)) {
        Response::validationError(['eventCategory' => 'Must be self_event or customer_event']);
        exit;
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
        exit;
    }
    
    // Sanitize inputs
    $eventModel = new Event();
    $eventData = [
        'name' => Validator::sanitize($data['name']),
        'eventDate' => $data['eventDate'],
        'eventTypeId' => (int)$data['eventTypeId'],
        'eventCategory' => $eventCategory,
        'notes' => isset($data['notes']) ? Validator::sanitize($data['notes']) : null,
        'createdBy' => $authUser['id']
    ];
    
    $eventId = $eventModel->create($eventData);
    
    if (!$eventId) {
        Response::serverError('Failed to create event');
        exit;
    }
    
    $event = $eventModel->getById($eventId);
    Response::success($eventModel->formatForResponse($event), 'Event created successfully', 201);

} else {
    Response::methodNotAllowed();
}

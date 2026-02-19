<?php
/**
 * Customers API - Index/List Endpoint
 * GET /api/customers
 * POST /api/customers (create new customer)
 * 
 * Get all customers with optional filters or create new customer
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load utilities
require_once __DIR__ . '/../../utils/Paginator.php';

// Load Customer model
require_once __DIR__ . '/../../models/Customer.php';

// Handle different HTTP methods
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method === 'GET') {
    // GET - List all customers
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Get query parameters for filtering
        $filters = [];
        
        // Admin-scoped access: Regular admins can only see their own customers
        // Superadmins can see all customers
        if ($authUser['role'] !== 'superadmin') {
            $filters['createdBy'] = $authUser['id'];
        }
        
        if (isset($_GET['search'])) {
            $filters['search'] = trim($_GET['search']);
        }
        
        if (isset($_GET['districtId'])) {
            $filters['districtId'] = (int)$_GET['districtId'];
        }
        
        if (isset($_GET['cityId'])) {
            $filters['cityId'] = (int)$_GET['cityId'];
        }
        
        // Event-based filters
        if (isset($_GET['eventId']) && !empty($_GET['eventId'])) {
            $filters['eventId'] = $_GET['eventId'];
        }
        
        if (isset($_GET['eventDate']) && !empty($_GET['eventDate'])) {
            $filters['eventDate'] = $_GET['eventDate'];
        }
        
        if (isset($_GET['careOfId']) && !empty($_GET['careOfId'])) {
            $filters['careOfId'] = (int)$_GET['careOfId'];
        }
        
        if (isset($_GET['invitationStatusId']) && !empty($_GET['invitationStatusId'])) {
            $filters['invitationStatusId'] = (int)$_GET['invitationStatusId'];
        }
        
        if (isset($_GET['giftStatus']) && !empty($_GET['giftStatus'])) {
            $validStatuses = ['gifted', 'not_gifted'];
            if (in_array($_GET['giftStatus'], $validStatuses)) {
                $filters['giftStatus'] = $_GET['giftStatus'];
            }
        }
        
        // Initialize Customer model
        $customerModel = new Customer();
        
        // Check if pagination is requested
        $isPaginated = isset($_GET['page']) || isset($_GET['perPage']);
        
        if ($isPaginated) {
            // Get pagination parameters
            $paginator = paginate(20); // Default 20 items per page
            
            // Get paginated customers
            $result = $customerModel->getAll($filters, $paginator);
            
            // Format customers for response
            $formattedCustomers = array_map(function($customer) use ($customerModel) {
                return $customerModel->formatForResponse($customer);
            }, $result->getMeta()['total'] > 0 ? $result->toArray()['data'] : []);
            
            // Set formatted data back to paginator
            $result->setData($formattedCustomers);
            
            // Get the base URL for pagination links
            $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . 
                       "://" . $_SERVER['HTTP_HOST'] . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            
            // Get pagination response with links
            $response = $result->toArray($baseUrl, $filters);
            
            // Return paginated response
            Response::success($response, 'Customers retrieved successfully', 200);
        } else {
            // Get all customers without pagination
            $customers = $customerModel->getAll($filters);
            
            // Format customers for response
            $formattedCustomers = array_map(function($customer) use ($customerModel) {
                return $customerModel->formatForResponse($customer);
            }, $customers);
            
            // Return success response
            Response::success($formattedCustomers, 'Customers retrieved successfully', 200);
        }
        
    } catch (Exception $e) {
        error_log("Error getting customers: " . $e->getMessage());
        Response::error('An error occurred while retrieving customers', 500);
    }
    
} elseif ($method === 'POST') {
    // POST - Create new customer
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $validator = new Validator();
        $validator->required('name', $input['name'] ?? null, 'Name')
                  ->required('mobileNumber', $input['mobileNumber'] ?? null, 'Mobile number')
                  ->mobileNumber('mobileNumber', $input['mobileNumber'] ?? null)
                  ->required('address', $input['address'] ?? null, 'Address')
                  ->required('districtId', $input['districtId'] ?? null, 'District')
                  ->required('cityId', $input['cityId'] ?? null, 'City');
        
        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
        }
        
        // Prepare customer data
        $customerData = [
            'name' => Validator::sanitize($input['name']),
            'mobileNumber' => Validator::sanitize($input['mobileNumber']),
            'address' => Validator::sanitize($input['address']),
            'stateId' => $input['stateId'] ?? 1, // Default to Kerala
            'districtId' => (int)$input['districtId'],
            'cityId' => (int)$input['cityId'],
            'notes' => isset($input['notes']) ? Validator::sanitize($input['notes']) : null,
            'createdBy' => $authUser['id']
        ];
        
        // Initialize Customer model
        $customerModel = new Customer();
        
        // Create customer
        $customerId = $customerModel->create($customerData);
        
        if (!$customerId) {
            Response::error('Failed to create customer', 500);
        }
        
        // Get created customer
        $customer = $customerModel->getById($customerId);
        $formattedCustomer = $customerModel->formatForResponse($customer);
        
        // Log activity
        error_log("Customer created: {$customerId} by {$authUser['mobileNumber']}");
        
        // Return success response
        Response::success($formattedCustomer, 'Customer created successfully', 201);
        
    } catch (Exception $e) {
        error_log("Error creating customer: " . $e->getMessage());
        Response::error('An error occurred while creating customer', 500);
    }
    
} else {
    Response::error('Method not allowed', 405);
}

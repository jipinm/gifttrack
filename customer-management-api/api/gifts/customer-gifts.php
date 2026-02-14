<?php
/**
 * Customer Gifts API
 * GET /api/gifts/customer-gifts.php?customerId={id}
 * 
 * Get all gifts for a specific customer
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load utilities
require_once __DIR__ . '/../../utils/Paginator.php';

// Load models
require_once __DIR__ . '/../../models/Gift.php';
require_once __DIR__ . '/../../models/Customer.php';

try {
    global $authUser;
    
    if (!$authUser) {
        Response::error('Not authenticated', 401);
    }
    
    // Get customer ID from query parameter (support both camelCase and snake_case)
    $customerId = $_GET['customerId'] ?? $_GET['customer_id'] ?? null;
    
    if (!$customerId || empty($customerId)) {
        Response::error('Customer ID is required', 400);
    }
    
    // Verify customer exists
    $customerModel = new Customer();
    
    // Admin-scoped access: Regular admins can only view gifts for their own customers
    $createdByFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
    
    if (!$customerModel->exists($customerId, $createdByFilter)) {
        Response::error('Customer not found', 404);
    }
    
    // Check if pagination is requested
    $isPaginated = isset($_GET['page']) || isset($_GET['perPage']);
    
    // Get gifts
    $giftModel = new Gift();
    
    if ($isPaginated) {
        // Get pagination parameters
        $paginator = paginate(20); // Default 20 items per page
        
        // Get paginated gifts
        $result = $giftModel->getByCustomerId($customerId, $paginator);
        
        // Format gifts for response
        $formattedGifts = array_map(function($gift) use ($giftModel) {
            return $giftModel->formatForResponse($gift);
        }, $result->getMeta()['total'] > 0 ? $result->toArray()['data'] : []);
        
        // Set formatted data back to paginator
        $result->setData($formattedGifts);
        
        // Get the base URL for pagination links
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . 
                   "://" . $_SERVER['HTTP_HOST'] . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Get pagination response with links
        $response = $result->toArray($baseUrl, ['customerId' => $customerId]);
        
        // Add total value to response
        $response['totalValue'] = $giftModel->getTotalValue($customerId);
        
        // Return paginated response
        Response::success($response, 'Gifts retrieved successfully', 200);
    } else {
        // Get all gifts without pagination
        $gifts = $giftModel->getByCustomerId($customerId);
        
        // Format gifts for response
        $formattedGifts = array_map(function($gift) use ($giftModel) {
            return $giftModel->formatForResponse($gift);
        }, $gifts);
        
        // Get total value
        $totalValue = $giftModel->getTotalValue($customerId);
        
        // Return success response
        Response::success([
            'gifts' => $formattedGifts,
            'totalValue' => $totalValue,
            'count' => count($formattedGifts)
        ], 'Gifts retrieved successfully', 200);
    }
    
} catch (Exception $e) {
    error_log("Error in customer-gifts endpoint: " . $e->getMessage());
    Response::error('An error occurred while retrieving gifts', 500);
}

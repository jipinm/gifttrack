<?php
/**
 * Customer Details Endpoint
 * GET /api/customers/{id}
 * PUT /api/customers/{id}
 * DELETE /api/customers/{id}
 * 
 * Get, update, or delete a single customer
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Apply authentication middleware
require_once __DIR__ . '/../../middleware/auth.php';

// Load Customer model
require_once __DIR__ . '/../../models/Customer.php';

// Get customer ID from query string
$customerId = $_GET['id'] ?? null;

if (!$customerId) {
    Response::error('Customer ID is required', 400);
}

// Handle different HTTP methods
$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method === 'GET') {
    // GET - Get single customer
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Initialize Customer model
        $customerModel = new Customer();
        
        // Admin-scoped access: Regular admins can only view their own customers
        $createdByFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
        
        // Get customer (with ownership check for regular admins)
        $customer = $customerModel->getById($customerId, $createdByFilter);
        
        if (!$customer) {
            Response::error('Customer not found', 404);
        }
        
        // Format customer for response
        $formattedCustomer = $customerModel->formatForResponse($customer);
        
        // Return success response
        Response::success($formattedCustomer, 'Customer retrieved successfully', 200);
        
    } catch (Exception $e) {
        error_log("Error getting customer: " . $e->getMessage());
        Response::error('An error occurred while retrieving customer', 500);
    }
    
} elseif ($method === 'PUT') {
    // PUT - Update customer
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Initialize Customer model
        $customerModel = new Customer();
        
        // Admin-scoped access: Regular admins can only update their own customers
        $createdByFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
        
        // Check if customer exists (and is owned by this admin if not superadmin)
        if (!$customerModel->exists($customerId, $createdByFilter)) {
            Response::error('Customer not found', 404);
        }
        
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Prepare update data (only include provided fields)
        $updateData = [];
        
        if (isset($input['name'])) {
            $updateData['name'] = Validator::sanitize($input['name']);
        }
        
        if (array_key_exists('mobileNumber', $input)) {
            $mobileValue = $input['mobileNumber'];
            if (!empty($mobileValue)) {
                // Validate format only when a non-empty value is provided
                if (!preg_match('/^[0-9]{10}$/', $mobileValue)) {
                    Response::error('Mobile number must be 10 digits', 400);
                }
                $updateData['mobileNumber'] = Validator::sanitize($mobileValue);
            } else {
                // Allow clearing mobile number (empty string or null)
                $updateData['mobileNumber'] = null;
            }
        }
        
        if (isset($input['address'])) {
            $updateData['address'] = Validator::sanitize($input['address']);
        }
        
        if (isset($input['stateId'])) {
            $updateData['stateId'] = (int)$input['stateId'];
        }
        
        if (isset($input['districtId'])) {
            $updateData['districtId'] = (int)$input['districtId'];
        }
        
        if (isset($input['cityId'])) {
            $updateData['cityId'] = (int)$input['cityId'];
        }
        
        if (isset($input['notes'])) {
            $updateData['notes'] = Validator::sanitize($input['notes']);
        }
        
        // Update customer
        $success = $customerModel->update($customerId, $updateData, $createdByFilter);
        
        if (!$success) {
            Response::error('Failed to update customer', 500);
        }
        
        // Get updated customer
        $customer = $customerModel->getById($customerId, $createdByFilter);
        $formattedCustomer = $customerModel->formatForResponse($customer);
        
        // Log activity
        error_log("Customer updated: {$customerId} by {$authUser['mobileNumber']}");
        
        // Return success response
        Response::success($formattedCustomer, 'Customer updated successfully', 200);
        
    } catch (Exception $e) {
        error_log("Error updating customer: " . $e->getMessage());
        Response::error('An error occurred while updating customer', 500);
    }
    
} elseif ($method === 'DELETE') {
    // DELETE - Delete customer
    try {
        global $authUser;
        
        if (!$authUser) {
            Response::error('Not authenticated', 401);
        }
        
        // Initialize Customer model
        $customerModel = new Customer();
        
        // Admin-scoped access: Regular admins can only delete their own customers
        $createdByFilter = ($authUser['role'] !== 'superadmin') ? $authUser['id'] : null;
        
        // Check if customer exists (and is owned by this admin if not superadmin)
        if (!$customerModel->exists($customerId, $createdByFilter)) {
            Response::error('Customer not found', 404);
        }
        
        // Check for related gifts
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM gifts WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $giftCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($giftCount > 0) {
            Response::error(
                "You cannot delete this customer because {$giftCount} gift(s) are linked to this account. Please delete the related gifts first before deleting this customer.",
                409
            );
        }
        
        // Check for related event attachments
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM event_customers WHERE customer_id = ?");
        $stmt->execute([$customerId]);
        $eventCount = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($eventCount > 0) {
            Response::error(
                "You cannot delete this customer because they are attached to {$eventCount} event(s). Please detach the customer from all events first before deleting.",
                409
            );
        }
        
        // Safe to delete - no related data exists
        $success = $customerModel->delete($customerId, $createdByFilter);
        
        if (!$success) {
            Response::error('Failed to delete customer', 500);
        }
        
        // Log activity
        error_log("Customer deleted: {$customerId} by {$authUser['mobileNumber']}");
        
        // Return success response
        Response::success(null, 'Customer deleted successfully', 200);
        
    } catch (Exception $e) {
        error_log("Error deleting customer: " . $e->getMessage());
        Response::error('An error occurred while deleting customer', 500);
    }
    
} else {
    Response::error('Method not allowed', 405);
}

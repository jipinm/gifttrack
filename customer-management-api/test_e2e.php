<?php
/**
 * End-to-End Testing Script
 * Tests complete user flow through the API
 * 
 * Run: php test_e2e.php
 */

$baseUrl = 'http://customer-management-api.local/api';
$superAdminMobile = '9999999999';
$superAdminPassword = 'Admin@123';
$adminMobile = '8888888888';
$adminPassword = 'Admin@123';

$testResults = [];
$totalTests = 0;
$passedTests = 0;

// Helper function to make API requests
function apiRequest($method, $url, $data = null, $token = null) {
    $ch = curl_init($url);
    
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data && in_array($method, ['POST', 'PUT'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $statusCode,
        'data' => json_decode($response, true)
    ];
}

// Test function
function test($name, $result, $debug = null) {
    global $testResults, $totalTests, $passedTests;
    $totalTests++;
    $passed = $result ? '✓' : '✗';
    if ($result) $passedTests++;
    $testResults[] = "$passed $name";
    echo "$passed $name";
    if (!$result && $debug) {
        echo " [DEBUG: $debug]";
    }
    echo "\n";
    return $result;
}

echo "\n";
echo "==========================================================\n";
echo "  CUSTOMER MANAGEMENT API - END-TO-END TEST\n";
echo "==========================================================\n\n";

// ==========================================================
// TEST 1: Super Admin Login
// ==========================================================
echo "TEST 1: Super Admin Login\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('POST', "$baseUrl/auth/login", [
    'mobileNumber' => $superAdminMobile,
    'password' => $superAdminPassword
]);

$loginData = $response['data']['data'] ?? $response['data'];

test("Login successful", $response['status'] === 200);
test("Response has token", isset($loginData['token']));
test("User is super admin", 
    isset($loginData['user']['role']) && 
    $loginData['user']['role'] === 'superadmin'
);

$superAdminToken = $loginData['token'] ?? null;
if (!$superAdminToken) {
    echo "ERROR: Failed to get super admin token.\n";
    exit(1);
}
echo "\n";

// ==========================================================
// TEST 2: Verify Token
// ==========================================================
echo "TEST 2: Verify Token\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/auth/verify", null, $superAdminToken);

$verifyData = $response['data']['data'] ?? $response['data'];

test("Token verification successful", $response['status'] === 200);
test("User data returned", isset($verifyData['user']));
echo "\n";

// ==========================================================
// TEST 3: Create New Admin User
// ==========================================================
echo "TEST 3: Create New Admin User\n";
echo "----------------------------------------------------------\n";

$newAdmin = [
    'name' => 'Test Admin User',
    'mobileNumber' => '5555555555',
    'password' => 'TestAdmin@123',
    'address' => '123 Test Street',
    'place' => 'Kochi',
    'branch' => 'Test Branch'
];

$response = apiRequest('POST', "$baseUrl/admins/create", $newAdmin, $superAdminToken);

$adminData = $response['data']['data'] ?? [];

test("Admin creation successful", $response['status'] === 201);
test("Admin has ID", isset($adminData['id']));
test("Password not in response", !isset($adminData['password']));

$newAdminId = $adminData['id'] ?? null;
echo "\n";

// ==========================================================
// TEST 4: Get All Admins
// ==========================================================
echo "TEST 4: Get All Admins\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/admins/index", null, $superAdminToken);

$adminsData = $response['data']['data'] ?? [];

test("Get admins successful", $response['status'] === 200, "Status: {$response['status']}");
test("Response is array", is_array($adminsData));
test("At least 3 admins exist", is_array($adminsData) && count($adminsData) >= 3, "Count: " . count($adminsData ?? []));
echo "\n";

// ==========================================================
// TEST 5: Login as Regular Admin
// ==========================================================
echo "TEST 5: Login as Regular Admin\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('POST', "$baseUrl/auth/login", [
    'mobileNumber' => $adminMobile,
    'password' => $adminPassword
]);

$adminLoginData = $response['data']['data'] ?? $response['data'];

test("Admin login successful", $response['status'] === 200);
test("User is admin", isset($adminLoginData['user']['role']) && $adminLoginData['user']['role'] === 'admin');

$adminToken = $adminLoginData['token'] ?? null;
echo "\n";

// ==========================================================
// TEST 6: Create Customer
// ==========================================================
echo "TEST 6: Create Customer\n";
echo "----------------------------------------------------------\n";

$customer = [
    'name' => 'E2E Test Customer',
    'mobileNumber' => '9988776655',
    'address' => '456 Customer Lane',
    'district' => 'Ernakulam',
    'city' => 'Kochi',
    'state' => 'Kerala',
    'eventDate' => '2026-08-15'
];

$response = apiRequest('POST', "$baseUrl/customers/create", $customer, $adminToken);

$customerData = $response['data']['data'] ?? [];

test("Customer creation successful", $response['status'] === 201, "Status: {$response['status']}");
test("Customer has ID", isset($customerData['id']));
test("Gift status is non-gifted", isset($customerData['giftStatus']) && $customerData['giftStatus'] === 'non-gifted');

$customerId = $customerData['id'] ?? null;
if (!$customerId) {
    echo "DEBUG: Customer response: " . json_encode($response) . "\n";
}
echo "\n";

// ==========================================================
// TEST 7: Get Customer by ID
// ==========================================================
echo "TEST 7: Get Customer by ID\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/customers/$customerId", null, $adminToken);

$fetchedCustomer = $response['data']['data'] ?? [];

test("Get customer successful", $response['status'] === 200);
test("Customer name matches", isset($fetchedCustomer['name']) && $fetchedCustomer['name'] === $customer['name']);
echo "\n";

// ==========================================================
// TEST 8: Add Gift to Customer
// ==========================================================
echo "TEST 8: Add Gift to Customer\n";
echo "----------------------------------------------------------\n";

$gift = [
    'customerId' => $customerId,
    'eventDate' => '2026-08-15',
    'giftTypeId' => 1,
    'value' => 10000,
    'description' => 'Wedding gift'
];

$response = apiRequest('POST', "$baseUrl/gifts/create", $gift, $adminToken);

$giftData = $response['data']['data'] ?? [];

test("Gift creation successful", $response['status'] === 201);
test("Gift has ID", isset($giftData['id']));
test("Gift value correct", isset($giftData['value']) && $giftData['value'] == 10000);

$giftId = $giftData['id'] ?? null;
echo "\n";

// ==========================================================
// TEST 9: Get Customer Gifts
// ==========================================================
echo "TEST 9: Get Customer Gifts\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/gifts/customer-gifts?customerId=$customerId", null, $adminToken);

$giftsData = $response['data']['data'] ?? [];

test("Get gifts successful", $response['status'] === 200);
test("At least one gift exists", isset($giftsData['gifts']) && is_array($giftsData['gifts']) && count($giftsData['gifts']) >= 1);
test("Total value calculated", isset($giftsData['totalValue']));
echo "\n";

// ==========================================================
// TEST 10: Update Gift
// ==========================================================
echo "TEST 10: Update Gift\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('PUT', "$baseUrl/gifts/update?id=$giftId", [
    'value' => 15000,
    'description' => 'Updated wedding gift'
], $adminToken);

$updatedGift = $response['data']['data'] ?? [];

test("Gift update successful", $response['status'] === 200);
test("Value updated", isset($updatedGift['value']) && $updatedGift['value'] == 15000);
echo "\n";

// ==========================================================
// TEST 11: Update Customer
// ==========================================================
echo "TEST 11: Update Customer\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('PUT', "$baseUrl/customers/update?id=$customerId", [
    'name' => 'Updated E2E Test Customer',
    'address' => 'Updated Address'
], $adminToken);

$updatedCustomer = $response['data']['data'] ?? [];

test("Customer update successful", $response['status'] === 200);
test("Name updated", isset($updatedCustomer['name']) && $updatedCustomer['name'] === 'Updated E2E Test Customer');
echo "\n";

// ==========================================================
// TEST 12: Search Customers
// ==========================================================
echo "TEST 12: Search Customers\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/customers/index?search=E2E", null, $adminToken);

$searchResults = $response['data']['data'] ?? [];

test("Search successful", $response['status'] === 200);
test("At least one result", is_array($searchResults) && count($searchResults) >= 1);
echo "\n";

// ==========================================================
// TEST 13: Filter Customers by Gift Status
// ==========================================================
echo "TEST 13: Filter Customers by Gift Status\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/customers/index?giftStatus=gifted", null, $adminToken);

$filterResults = $response['data']['data'] ?? [];

test("Filter successful", $response['status'] === 200);
test("Results are gifted", 
    !is_array($filterResults) || count($filterResults) === 0 || 
    (isset($filterResults[0]['giftStatus']) && $filterResults[0]['giftStatus'] === 'gifted')
);
echo "\n";

// ==========================================================
// TEST 14: Get Master Data
// ==========================================================
echo "TEST 14: Get Master Data\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/master/states", null, $adminToken);
test("Get states successful", $response['status'] === 200);

$response = apiRequest('GET', "$baseUrl/master/districts", null, $adminToken);
test("Get districts successful", $response['status'] === 200);

$response = apiRequest('GET', "$baseUrl/master/gift-types", null, $adminToken);
test("Get gift types successful", $response['status'] === 200);
echo "\n";

// ==========================================================
// TEST 15: Delete Gift
// ==========================================================
echo "TEST 15: Delete Gift\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('DELETE', "$baseUrl/gifts/delete?id=$giftId", null, $adminToken);

test("Gift deletion successful", $response['status'] === 200);
echo "\n";

// ==========================================================
// TEST 16: Delete Customer
// ==========================================================
echo "TEST 16: Delete Customer\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('DELETE', "$baseUrl/customers/delete?id=$customerId", null, $adminToken);

test("Customer deletion successful", $response['status'] === 200);
echo "\n";

// ==========================================================
// TEST 17: Delete Admin User
// ==========================================================
echo "TEST 17: Delete Admin User\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('DELETE', "$baseUrl/admins/delete?id=$newAdminId", null, $superAdminToken);

test("Admin deletion successful", $response['status'] === 200);
echo "\n";

// ==========================================================
// TEST 18: Logout
// ==========================================================
echo "TEST 18: Logout\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('POST', "$baseUrl/auth/logout", null, $adminToken);

test("Logout successful", $response['status'] === 200);
echo "\n";

// ==========================================================
// TEST 19: Error Handling - Invalid Token
// ==========================================================
echo "TEST 19: Error Handling - Invalid Token\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('GET', "$baseUrl/customers/index", null, 'invalid_token');

test("Invalid token rejected", $response['status'] === 401);
echo "\n";

// ==========================================================
// TEST 20: Error Handling - Missing Required Fields
// ==========================================================
echo "TEST 20: Error Handling - Missing Required Fields\n";
echo "----------------------------------------------------------\n";

$response = apiRequest('POST', "$baseUrl/customers/create", [
    'name' => 'Incomplete Customer'
], $adminToken);

test("Missing fields validation", $response['status'] === 400);
echo "\n";

// ==========================================================
// SUMMARY
// ==========================================================
echo "==========================================================\n";
echo "  TEST SUMMARY\n";
echo "==========================================================\n";
echo "Total Tests: $totalTests\n";
echo "Passed: $passedTests\n";
echo "Failed: " . ($totalTests - $passedTests) . "\n";
echo "Success Rate: " . round(($passedTests / $totalTests) * 100, 2) . "%\n";
echo "==========================================================\n\n";

if ($passedTests === $totalTests) {
    echo "✓ ALL TESTS PASSED!\n\n";
    exit(0);
} else {
    echo "✗ SOME TESTS FAILED\n\n";
    exit(1);
}

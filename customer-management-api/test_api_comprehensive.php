<?php
/**
 * Comprehensive API Endpoints Test
 */

require_once __DIR__ . '/bootstrap.php';

// ANSI color codes for terminal output
$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

// Test results
$tests = [];
$passed = 0;
$failed = 0;

function test($name, $url, $method = 'GET', $data = null, $token = null, $expectedStatus = 200) {
    global $tests, $passed, $failed, $green, $red, $yellow, $reset;
    
    $ch = curl_init();
    
    $fullUrl = 'http://localhost/customer-management-api' . $url;
    
    curl_setopt($ch, CURLOPT_URL, $fullUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Content-Type: application/json'];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    $success = ($httpCode == $expectedStatus);
    
    if ($success) {
        $passed++;
        $status = "{$green}✓ PASS{$reset}";
    } else {
        $failed++;
        $status = "{$red}✗ FAIL{$reset}";
    }
    
    $tests[] = [
        'name' => $name,
        'method' => $method,
        'url' => $url,
        'expected' => $expectedStatus,
        'actual' => $httpCode,
        'success' => $success,
        'response' => $response,
        'error' => $error
    ];
    
    echo sprintf("  %s %s %s (Expected: %d, Got: %d)\n", 
        $status, 
        str_pad($method, 6), 
        str_pad($name, 40),
        $expectedStatus, 
        $httpCode
    );
    
    return json_decode($response, true);
}

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "  CUSTOMER MANAGEMENT API - ENDPOINT TESTS\n";
echo str_repeat("=", 70) . "\n\n";

// Test 1: Health Check
echo "{$blue}1. Health & Status Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";
test('Health Check', '/api/health');
test('API Index', '/api/');
echo "\n";

// Test 2: Authentication
echo "{$blue}2. Authentication Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";

// Login with superadmin
$loginResponse = test('Login - Superadmin', '/api/auth/login', 'POST', [
    'mobile_number' => '9999999999',
    'password' => 'Admin@123'
]);

$token = $loginResponse['data']['token'] ?? null;

if ($token) {
    echo "     {$green}Token obtained successfully{$reset}\n";
    test('Verify Token', '/api/auth/verify', 'GET', null, $token);
} else {
    echo "     {$red}Failed to get token - subsequent tests may fail{$reset}\n";
}

// Login with regular admin
$adminLoginResponse = test('Login - Admin', '/api/auth/login', 'POST', [
    'mobile_number' => '8888888888',
    'password' => 'Admin@123'
]);

$adminToken = $adminLoginResponse['data']['token'] ?? null;

// Test invalid login
test('Login - Invalid credentials', '/api/auth/login', 'POST', [
    'mobile_number' => '0000000000',
    'password' => 'wrongpassword'
], null, 401);

echo "\n";

// Test 3: Customer Endpoints
echo "{$blue}3. Customer Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";

if ($token) {
    $customersResponse = test('Get All Customers', '/api/customers', 'GET', null, $token);
    
    $customers = $customersResponse['data'] ?? [];
    
    if (!empty($customers)) {
        $firstCustomer = is_array($customers) ? $customers[0] : null;
        
        if ($firstCustomer && isset($firstCustomer['id'])) {
            test('Get Customer by ID', '/api/customers/show?id=' . $firstCustomer['id'], 'GET', null, $token);
        }
    }
    
    // Test pagination
    test('Get Customers - Paginated', '/api/customers?page=1&perPage=5', 'GET', null, $token);
    
    // Test search
    test('Search Customers', '/api/customers?search=test', 'GET', null, $token);
    
    // Test create customer
    $newCustomerResponse = test('Create Customer', '/api/customers', 'POST', [
        'name' => 'Test Customer ' . time(),
        'mobileNumber' => '9' . rand(100000000, 999999999),
        'address' => 'Test Address',
        'stateId' => 1,
        'districtId' => 1,
        'cityId' => 1,
        'notes' => 'Created by automated test'
    ], $token, 201);
    
} else {
    echo "     {$red}Skipped - No authentication token{$reset}\n";
}

echo "\n";

// Test 4: Event Endpoints
echo "{$blue}4. Event Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";

if ($token) {
    $eventsResponse = test('Get All Events', '/api/events', 'GET', null, $token);
    
    $events = $eventsResponse['data'] ?? [];
    
    if (!empty($events) && is_array($events)) {
        $firstEvent = $events[0] ?? null;
        
        if ($firstEvent && isset($firstEvent['id'])) {
            test('Get Event by ID', '/api/events/show?id=' . $firstEvent['id'], 'GET', null, $token);
            test('Get Event Customers', '/api/events/customers?event_id=' . $firstEvent['id'], 'GET', null, $token);
        }
    }
} else {
    echo "     {$red}Skipped - No authentication token{$reset}\n";
}

echo "\n";

// Test 5: Gift Endpoints
echo "{$blue}5. Gift Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";

if ($token) {
    // Check if there's a customer with gifts
    if (!empty($customers) && is_array($customers)) {
        $customerWithPotentialGifts = $customers[0];
        
        if (isset($customerWithPotentialGifts['id'])) {
            test('Get Customer Gifts', '/api/gifts/customer-gifts?customer_id=' . $customerWithPotentialGifts['id'], 'GET', null, $token);
        }
    }
} else {
    echo "     {$red}Skipped - No authentication token{$reset}\n";
}

echo "\n";

// Test 6: Master Data Endpoints
echo "{$blue}6. Master Data Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";

if ($token) {
    test('Get States', '/api/master/states', 'GET', null, $token);
    test('Get Districts', '/api/master/districts', 'GET', null, $token);
    test('Get Cities', '/api/master/cities', 'GET', null, $token);
    test('Get Event Types', '/api/master/event-types', 'GET', null, $token);
    test('Get Gift Types', '/api/master/gift-types', 'GET', null, $token);
    test('Get Care Of Options', '/api/master/care-of-options', 'GET', null, $token);
    test('Get Invitation Status', '/api/master/invitation-status', 'GET', null, $token);
} else {
    echo "     {$red}Skipped - No authentication token{$reset}\n";
}

echo "\n";

// Test 7: Authorization Tests
echo "{$blue}7. Authorization & Security Tests{$reset}\n";
echo str_repeat("-", 70) . "\n";

test('Unauthorized Access', '/api/customers', 'GET', null, null, 401);
test('Invalid Token', '/api/customers', 'GET', null, 'invalid-token-here', 401);

echo "\n";

// Summary
echo str_repeat("=", 70) . "\n";
echo "  TEST SUMMARY\n";
echo str_repeat("=", 70) . "\n";
echo sprintf("  Total Tests:  %d\n", $passed + $failed);
echo sprintf("  {$green}Passed:       %d{$reset}\n", $passed);
echo sprintf("  {$red}Failed:       %d{$reset}\n", $failed);
echo sprintf("  Success Rate: %.1f%%\n", ($passed / ($passed + $failed)) * 100);
echo str_repeat("=", 70) . "\n\n";

// Show failed tests details
if ($failed > 0) {
    echo "{$yellow}Failed Tests Details:{$reset}\n";
    echo str_repeat("-", 70) . "\n";
    
    foreach ($tests as $test) {
        if (!$test['success']) {
            echo "\n{$red}✗ {$test['name']}{$reset}\n";
            echo "  Method: {$test['method']}\n";
            echo "  URL: {$test['url']}\n";
            echo "  Expected Status: {$test['expected']}\n";
            echo "  Actual Status: {$test['actual']}\n";
            
            if ($test['error']) {
                echo "  Error: {$test['error']}\n";
            }
            
            if ($test['response']) {
                $responseData = json_decode($test['response'], true);
                if ($responseData) {
                    echo "  Response: " . json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
                }
            }
        }
    }
    
    echo "\n";
}

exit($failed > 0 ? 1 : 0);

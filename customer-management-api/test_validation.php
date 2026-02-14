<?php
/**
 * API Validation & Error Handling Test
 */

require_once __DIR__ . '/bootstrap.php';

$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

$passed = 0;
$failed = 0;

function testValidation($name, $url, $method, $data, $token, $expectedStatus, $expectedErrorPattern = null) {
    global $passed, $failed, $green, $red;
    
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
    curl_close($ch);
    
    $responseData = json_decode($response, true);
    
    $success = ($httpCode == $expectedStatus);
    
    if ($expectedErrorPattern && $success) {
        $errorMessage = $responseData['error'] ?? '';
        $success = stripos($errorMessage, $expectedErrorPattern) !== false;
    }
    
    if ($success) {
        $passed++;
        echo "{$green}✓{$reset} ";
    } else {
        $failed++;
        echo "{$red}✗{$reset} ";
    }
    
    echo "{$name} (Expected: {$expectedStatus}, Got: {$httpCode})\n";
    
    if (!$success && $responseData) {
        echo "  Response: " . json_encode($responseData, JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    return $responseData;
}

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "  API VALIDATION & ERROR HANDLING TESTS\n";
echo str_repeat("=", 70) . "\n\n";

// Get a valid token first
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/customer-management-api/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'mobile_number' => '9999999999',
    'password' => 'Admin@123'
]));
$response = curl_exec($ch);
curl_close($ch);
$loginData = json_decode($response, true);
$token = $loginData['data']['token'] ?? null;

if (!$token) {
    echo "{$red}Failed to get authentication token{$reset}\n";
    exit(1);
}

// Test 1: Authentication Validation
echo "{$blue}1. Authentication Validation{$reset}\n";
echo str_repeat("-", 70) . "\n";

testValidation('Missing mobile number', '/api/auth/login', 'POST', 
    ['password' => 'Admin@123'], 
    null, 400, 'mobile number');

testValidation('Missing password', '/api/auth/login', 'POST', 
    ['mobile_number' => '9999999999'], 
    null, 400, 'password');

testValidation('Invalid mobile format', '/api/auth/login', 'POST', 
    ['mobile_number' => '123', 'password' => 'Admin@123'], 
    null, 400, 'mobile number');

testValidation('Wrong credentials', '/api/auth/login', 'POST', 
    ['mobile_number' => '9999999999', 'password' => 'wrongpassword'], 
    null, 401, 'Invalid credentials');

testValidation('Invalid JSON', '/api/auth/login', 'POST', 
    null, 
    null, 400);

echo "\n";

// Test 2: Authorization Checks
echo "{$blue}2. Authorization Checks{$reset}\n";
echo str_repeat("-", 70) . "\n";

testValidation('No token - Customers', '/api/customers', 'GET', null, null, 401);
testValidation('No token - Events', '/api/events', 'GET', null, null, 401);
testValidation('Invalid token format', '/api/customers', 'GET', null, 'invalid-token', 401);

echo "\n";

// Test 3: Customer Validation
echo "{$blue}3. Customer Validation{$reset}\n";
echo str_repeat("-", 70) . "\n";

testValidation('Create - Missing name', '/api/customers', 'POST', 
    [
        'mobileNumber' => '9876543210',
        'address' => 'Test Address',
        'districtId' => 1,
        'cityId' => 1
    ], 
    $token, 422, 'name');

testValidation('Create - Missing mobile', '/api/customers', 'POST', 
    [
        'name' => 'Test Customer',
        'address' => 'Test Address',
        'districtId' => 1,
        'cityId' => 1
    ], 
    $token, 422, 'mobile');

testValidation('Create - Invalid mobile', '/api/customers', 'POST', 
    [
        'name' => 'Test Customer',
        'mobileNumber' => '123',
        'address' => 'Test Address',
        'districtId' => 1,
        'cityId' => 1
    ], 
    $token, 422, 'mobile');

testValidation('Create - Missing address', '/api/customers', 'POST', 
    [
        'name' => 'Test Customer',
        'mobileNumber' => '9876543210',
        'districtId' => 1,
        'cityId' => 1
    ], 
    $token, 422, 'address');

testValidation('Create - Missing district', '/api/customers', 'POST', 
    [
        'name' => 'Test Customer',
        'mobileNumber' => '9876543210',
        'address' => 'Test Address',
        'cityId' => 1
    ], 
    $token, 422, 'district');

testValidation('Create - Missing city', '/api/customers', 'POST', 
    [
        'name' => 'Test Customer',
        'mobileNumber' => '9876543210',
        'address' => 'Test Address',
        'districtId' => 1
    ], 
    $token, 422, 'city');

testValidation('Get - Invalid ID format', '/api/customers/show?id=invalid-uuid', 'GET', 
    null, 
    $token, 404);

testValidation('Get - Non-existent ID', '/api/customers/show?id=00000000-0000-0000-0000-000000000000', 'GET', 
    null, 
    $token, 404);

echo "\n";

// Test 4: Content Type Validation
echo "{$blue}4. Content Type & Input Validation{$reset}\n";
echo str_repeat("-", 70) . "\n";

// Test with malformed JSON
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/customer-management-api/api/customers');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{invalid json}');
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 400) {
    $passed++;
    echo "{$green}✓{$reset} ";
} else {
    $failed++;
    echo "{$red}✗{$reset} ";
}
echo "Malformed JSON handling (Expected: 400, Got: {$httpCode})\n";

echo "\n";

// Test 5: Method Validation
echo "{$blue}5. HTTP Method Validation{$reset}\n";
echo str_repeat("-", 70) . "\n";

testValidation('Login with GET (should be POST)', '/api/auth/login', 'GET', null, null, 405);

echo "\n";

// Summary
echo str_repeat("=", 70) . "\n";
echo "  VALIDATION TEST SUMMARY\n";
echo str_repeat("=", 70) . "\n";
echo sprintf("  Total Tests:  %d\n", $passed + $failed);
echo sprintf("  {$green}Passed:       %d{$reset}\n", $passed);
echo sprintf("  {$red}Failed:       %d{$reset}\n", $failed);
echo sprintf("  Success Rate: %.1f%%\n", ($passed / ($passed + $failed)) * 100);
echo str_repeat("=", 70) . "\n\n";

exit($failed > 0 ? 1 : 0);

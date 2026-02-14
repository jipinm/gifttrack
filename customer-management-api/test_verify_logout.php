<?php
/**
 * Test Verify and Logout Endpoints
 */

echo "=== Testing /api/auth/verify and /api/auth/logout ===\n\n";

// Step 1: Login
echo "1. Logging in...\n";
$loginUrl = 'http://customer-management-api.local/api/auth/login';
$loginData = json_encode([
    'mobile_number' => '9999999999',
    'password' => 'Admin@123'
]);

$ch = curl_init($loginUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
curl_close($ch);

$loginResponse = json_decode($response, true);

if (!$loginResponse['success']) {
    die("Login failed: " . $loginResponse['error'] . "\n");
}

$token = $loginResponse['data']['token'];
echo "✓ Login successful\n";
echo "Token: " . substr($token, 0, 50) . "...\n\n";

// Step 2: Test Verify Endpoint
echo "2. Testing /api/auth/verify...\n";
$verifyUrl = 'http://customer-management-api.local/api/auth/verify';

$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

$verifyResponse = json_decode($response, true);
if ($verifyResponse['success']) {
    echo "✓ Verify endpoint working correctly\n\n";
} else {
    echo "✗ Verify endpoint failed: " . $verifyResponse['error'] . "\n\n";
}

// Step 3: Test Logout Endpoint
echo "3. Testing /api/auth/logout...\n";
$logoutUrl = 'http://customer-management-api.local/api/auth/logout';

$ch = curl_init($logoutUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

$logoutResponse = json_decode($response, true);
if ($logoutResponse['success']) {
    echo "✓ Logout endpoint working correctly\n\n";
} else {
    echo "✗ Logout endpoint failed: " . $logoutResponse['error'] . "\n\n";
}

echo "=== Test Complete ===\n";

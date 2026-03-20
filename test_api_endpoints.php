<?php
/**
 * API Endpoint Test Script
 * Tests all API endpoints and reports results
 */

$base = 'http://localhost/gifttrack/customer-management-api';

function testEndpoint($label, $method, $url, $body = null, $token = null) {
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo str_pad($label, 45) . "=> CURL ERROR: $error\n";
        return null;
    }

    $data = json_decode($response, true);
    $success = $data['success'] ?? false;
    $itemCount = '';
    if ($success && isset($data['data']) && is_array($data['data'])) {
        $itemCount = ' [' . count($data['data']) . ' items]';
    } elseif ($success && isset($data['data']['data']) && is_array($data['data']['data'])) {
        $itemCount = ' [' . count($data['data']['data']) . ' items, paginated]';
    }

    $status = $success ? "✓ OK $itemCount" : "✗ HTTP $httpCode - " . ($data['error'] ?? $data['message'] ?? 'unknown');
    echo str_pad($label, 45) . "=> $status\n";

    return $success ? $data : null;
}

echo "\n";
echo "==============================================\n";
echo " API ENDPOINT TEST  \n";
echo " Base: $base\n";
echo "==============================================\n\n";

// 1. Health
echo "--- Infrastructure ---\n";
testEndpoint('GET  /api/health', 'GET', "$base/api/health");

// 2. Auth - Login
echo "\n--- Authentication ---\n";
$loginResult = null;
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['mobileNumber' => '9999999999', 'password' => 'Admin@123']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);
$resp = json_decode(curl_exec($ch), true);
curl_close($ch);
$token = $resp['data']['token'] ?? null;
$user = $resp['data']['user']['role'] ?? 'unknown';
echo str_pad('POST /api/auth/login', 45) . "=> " . ($token ? "✓ OK [role: $user]" : "✗ FAIL - " . ($resp['error'] ?? $resp['message'] ?? 'no token')) . "\n";

if (!$token) {
    echo "\nCannot continue without auth token.\n";
    exit(1);
}

testEndpoint('GET  /api/auth/verify', 'GET', "$base/api/auth/verify", null, $token);
testEndpoint('POST /api/auth/change-password', 'POST', "$base/api/auth/change-password", ['currentPassword' => 'wrong', 'newPassword' => 'test'], $token);

// 3. Master Data
echo "\n--- Master Data ---\n";
testEndpoint('GET  /api/master/states', 'GET', "$base/api/master/states", null, $token);
testEndpoint('GET  /api/master/districts', 'GET', "$base/api/master/districts", null, $token);
testEndpoint('GET  /api/master/cities', 'GET', "$base/api/master/cities", null, $token);
testEndpoint('GET  /api/master/event-types', 'GET', "$base/api/master/event-types", null, $token);
testEndpoint('GET  /api/master/gift-types', 'GET', "$base/api/master/gift-types", null, $token);
testEndpoint('GET  /api/master/invitation-status', 'GET', "$base/api/master/invitation-status", null, $token);
testEndpoint('GET  /api/master/care-of-options', 'GET', "$base/api/master/care-of-options", null, $token);

// 4. Customers
echo "\n--- Customers ---\n";
$custResult = testEndpoint('GET  /api/customers', 'GET', "$base/api/customers", null, $token);
testEndpoint('GET  /api/customers?search=test', 'GET', "$base/api/customers?search=test", null, $token);

// 5. Events
echo "\n--- Events ---\n";
$evResult = testEndpoint('GET  /api/events', 'GET', "$base/api/events", null, $token);
testEndpoint('GET  /api/events?page=1&perPage=10', 'GET', "$base/api/events?page=1&perPage=10", null, $token);

// 6. Admins
echo "\n--- Admins ---\n";
testEndpoint('GET  /api/admins', 'GET', "$base/api/admins", null, $token);

// 7. Gifts
echo "\n--- Gifts ---\n";
testEndpoint('GET  /api/gifts', 'GET', "$base/api/gifts", null, $token);

// 8. Logout
echo "\n--- Cleanup ---\n";
testEndpoint('POST /api/auth/logout', 'POST', "$base/api/auth/logout", null, $token);

echo "\n==============================================\n";
echo " Test complete\n";
echo "==============================================\n\n";

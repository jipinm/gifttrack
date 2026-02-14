<?php
/**
 * Test Token Blacklist after Logout
 */

echo "=== Testing Token Blacklist ===\n\n";

// Step 1: Login
echo "1. Logging in as Super Admin...\n";
$loginResult = shell_exec('curl -s -X POST http://customer-management-api.local/api/auth/login -H "Content-Type: application/json" -d "{\"mobile_number\":\"9999999999\",\"password\":\"Admin@123\"}"');
$login = json_decode($loginResult, true);

if (!isset($login['success']) || !$login['success']) {
    die("Login failed: " . ($login['error'] ?? 'Unknown error') . "\n");
}

$token = $login['data']['token'];
echo "✓ Login successful\n\n";

// Step 2: Verify token works
echo "2. Testing protected endpoint (before logout)...\n";
$verifyResult = shell_exec('curl -s http://customer-management-api.local/api/auth/verify -H "Authorization: Bearer ' . $token . '"');
$verify = json_decode($verifyResult, true);

if ($verify['success']) {
    echo "✓ Token is valid (expected)\n\n";
} else {
    echo "✗ Token invalid (unexpected): " . $verify['error'] . "\n\n";
}

// Step 3: Logout
echo "3. Logging out...\n";
$logoutResult = shell_exec('curl -s -X POST http://customer-management-api.local/api/auth/logout -H "Authorization: Bearer ' . $token . '"');
$logout = json_decode($logoutResult, true);

if ($logout['success']) {
    echo "✓ Logout successful\n\n";
} else {
    echo "✗ Logout failed: " . $logout['error'] . "\n\n";
}

// Step 4: Try to use the same token after logout
echo "4. Testing protected endpoint (after logout)...\n";
$verifyAfterResult = shell_exec('curl -s http://customer-management-api.local/api/auth/verify -H "Authorization: Bearer ' . $token . '"');
$verifyAfter = json_decode($verifyAfterResult, true);

if (!$verifyAfter['success']) {
    echo "✓ Token correctly rejected: " . $verifyAfter['error'] . "\n\n";
} else {
    echo "✗ Token still valid (should be blacklisted!)\n\n";
}

// Step 5: Try to create admin with blacklisted token
echo "5. Testing admin creation with blacklisted token...\n";
$adminData = json_encode([
    'name' => 'Test Admin',
    'mobileNumber' => '7777777777',
    'password' => 'Test@123',
    'address' => 'Test Address',
    'place' => 'Test Place',
    'branch' => 'Test Branch'
]);
$createAdminResult = shell_exec('curl -s -X POST http://customer-management-api.local/api/admins -H "Authorization: Bearer ' . $token . '" -H "Content-Type: application/json" -d \'' . $adminData . '\'');
$createAdmin = json_decode($createAdminResult, true);

if (!$createAdmin['success']) {
    echo "✓ Admin creation correctly rejected: " . $createAdmin['error'] . "\n\n";
} else {
    echo "✗ Admin creation succeeded (should be blocked!)\n\n";
}

echo "=== Test Complete ===\n";

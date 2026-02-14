<?php
// Simple test - directly via command line HTTP call

// Login first
$loginCmd = 'curl -X POST http://customer-management-api.local/api/auth/login -H "Content-Type: application/json" -d "{\"mobile_number\":\"9999999999\",\"password\":\"Admin@123\"}"';

echo "Login command:\n$loginCmd\n\n";
$loginResult = shell_exec($loginCmd);
echo "Login result:\n$loginResult\n\n";

$login = json_decode($loginResult, true);
if (!isset($login['success']) || !$login['success']) {
    die("Login failed\n");
}

$token = $login['data']['token'];
echo "Got token: " . substr($token, 0, 50) . "...\n\n";

// Test verify
echo "Testing verify endpoint...\n";
$verifyCmd = 'curl http://customer-management-api.local/api/auth/verify -H "Authorization: Bearer ' . $token . '"';
$verifyResult = shell_exec($verifyCmd);
echo "Verify result:\n$verifyResult\n\n";

// Test logout
echo "Testing logout endpoint...\n";
$logoutCmd = 'curl -X POST http://customer-management-api.local/api/auth/logout -H "Authorization: Bearer ' . $token . '"';
$logoutResult = shell_exec($logoutCmd);
echo "Logout result:\n$logoutResult\n";

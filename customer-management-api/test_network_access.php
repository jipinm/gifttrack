<?php
/**
 * Test Network IP Access
 * Tests if the API is accessible via local network IP
 */

$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "  NETWORK IP ACCESS TEST\n";
echo str_repeat("=", 70) . "\n\n";

// Get local IP
$localIP = '192.168.1.4';

echo "{$blue}Testing API Access via Different URLs:{$reset}\n";
echo str_repeat("-", 70) . "\n";

$urls = [
    'Localhost' => 'http://localhost/customer-management-api/api/health',
    'IPv4' => "http://{$localIP}/customer-management-api/api/health",
    '127.0.0.1' => 'http://127.0.0.1/customer-management-api/api/health'
];

foreach ($urls as $name => $url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($httpCode == 200 && $response) {
        $data = json_decode($response, true);
        echo "{$green}✓{$reset} {$name}: {$url}\n";
        if ($data && isset($data['data']['status'])) {
            echo "  Status: {$data['data']['status']}\n";
        }
    } else {
        echo "{$red}✗{$reset} {$name}: {$url}\n";
        if ($error) {
            echo "  Error: {$error}\n";
        } else {
            echo "  HTTP Code: {$httpCode}\n";
        }
    }
    echo "\n";
}

echo str_repeat("=", 70) . "\n";
echo "{$blue}Test Login via IP Address:{$reset}\n";
echo str_repeat("-", 70) . "\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://{$localIP}/customer-management-api/api/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'mobile_number' => '9999999999',
    'password' => 'Admin@123'
]));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode == 200 && $response) {
    $data = json_decode($response, true);
    if ($data && $data['success'] && isset($data['data']['token'])) {
        echo "{$green}✓ Login successful via IP address{$reset}\n";
        echo "  Token: " . substr($data['data']['token'], 0, 50) . "...\n";
        echo "  User: {$data['data']['user']['name']} ({$data['data']['user']['role']})\n";
    } else {
        echo "{$yellow}⚠ Login response received but unexpected format{$reset}\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
} else {
    echo "{$red}✗ Login failed via IP address{$reset}\n";
    if ($error) {
        echo "  Error: {$error}\n";
    } else {
        echo "  HTTP Code: {$httpCode}\n";
        if ($response) {
            echo "  Response: {$response}\n";
        }
    }
}

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "{$blue}Access URLs:{$reset}\n";
echo str_repeat("-", 70) . "\n";
echo "  API Base (Localhost):  http://localhost/customer-management-api/api\n";
echo "  API Base (Network IP): http://{$localIP}/customer-management-api/api\n";
echo "  Health Check:          http://{$localIP}/customer-management-api/api/health\n";
echo "  Login:                 http://{$localIP}/customer-management-api/api/auth/login\n";
echo str_repeat("=", 70) . "\n\n";

echo "{$yellow}Note:{$reset} If you're testing from another device on the network:\n";
echo "  1. Make sure Windows Firewall allows incoming connections on port 80\n";
echo "  2. Apache must be configured to listen on all interfaces (0.0.0.0:80)\n";
echo "  3. Your network must allow communication between devices\n\n";

<?php
/**
 * Final Network Configuration Test
 * Comprehensive test of all access methods
 */

$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "  NETWORK CONFIGURATION - FINAL VERIFICATION\n";
echo str_repeat("=", 70) . "\n\n";

$localIP = '192.168.1.4';
$passed = 0;
$failed = 0;

function testEndpoint($name, $url, &$passed, &$failed) {
    global $green, $red;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "{$green}✓{$reset} {$name}\n";
        $passed++;
        return true;
    } else {
        echo "{$red}✗{$reset} {$name} (HTTP {$httpCode})\n";
        $failed++;
        return false;
    }
}

echo "{$blue}1. Testing API Health Endpoints{$reset}\n";
echo str_repeat("-", 70) . "\n";
testEndpoint("Localhost Health", "http://localhost/customer-management-api/api/health", $passed, $failed);
testEndpoint("Local IP Health", "http://{$localIP}/customer-management-api/api/health", $passed, $failed);
testEndpoint("Loopback Health", "http://127.0.0.1/customer-management-api/api/health", $passed, $failed);
echo "\n";

echo "{$blue}2. Testing Authentication via IP{$reset}\n";
echo str_repeat("-", 70) . "\n";

$loginData = [
    'mobile_number' => '9999999999',
    'password' => 'Admin@123'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://{$localIP}/customer-management-api/api/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    if ($data && $data['success'] && isset($data['data']['token'])) {
        echo "{$green}✓{$reset} Login via IP address\n";
        $token = $data['data']['token'];
        $passed++;
    } else {
        echo "{$red}✗{$reset} Login response invalid\n";
        $failed++;
        $token = null;
    }
} else {
    echo "{$red}✗{$reset} Login failed (HTTP {$httpCode})\n";
    $failed++;
    $token = null;
}
echo "\n";

if ($token) {
    echo "{$blue}3. Testing Protected Endpoints via IP{$reset}\n";
    echo str_repeat("-", 70) . "\n";
    
    $endpoints = [
        'Customers List' => "http://{$localIP}/customer-management-api/api/customers",
        'Events List' => "http://{$localIP}/customer-management-api/api/events",
        'Master - States' => "http://{$localIP}/customer-management-api/api/master/states",
        'Master - Districts' => "http://{$localIP}/customer-management-api/api/master/districts",
        'Master - Cities' => "http://{$localIP}/customer-management-api/api/master/cities"
    ];
    
    foreach ($endpoints as $name => $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode == 200) {
            echo "{$green}✓{$reset} {$name}\n";
            $passed++;
        } else {
            echo "{$red}✗{$reset} {$name} (HTTP {$httpCode})\n";
            $failed++;
        }
    }
    echo "\n";
}

echo str_repeat("=", 70) . "\n";
echo "  TEST SUMMARY\n";
echo str_repeat("=", 70) . "\n";
echo sprintf("Total Tests:  %d\n", $passed + $failed);
echo sprintf("{$green}Passed:       %d{$reset}\n", $passed);
echo sprintf("{$red}Failed:       %d{$reset}\n", $failed);
echo sprintf("Success Rate: %.1f%%\n", ($passed / ($passed + $failed)) * 100);
echo str_repeat("=", 70) . "\n\n";

echo "{$blue}📱 MOBILE APP CONFIGURATION{$reset}\n";
echo str_repeat("-", 70) . "\n";
echo "Use this base URL in your mobile app:\n\n";
echo "  {$green}http://{$localIP}/customer-management-api/api{$reset}\n\n";

echo "Example configuration:\n";
echo "```javascript\n";
echo "const API_BASE_URL = 'http://{$localIP}/customer-management-api/api';\n";
echo "```\n\n";

echo str_repeat("=", 70) . "\n";
echo "{$blue}🌐 ACCESS FROM OTHER DEVICES{$reset}\n";
echo str_repeat("-", 70) . "\n";
echo "From any device on your WiFi network, open:\n\n";
echo "  {$green}http://{$localIP}/customer-management-api/api/health{$reset}\n\n";
echo "If it doesn't work:\n";
echo "  1. Run setup_firewall.bat as Administrator\n";
echo "  2. Make sure Apache is running in XAMPP\n";
echo "  3. Check if devices are on the same network\n";
echo str_repeat("=", 70) . "\n\n";

if ($failed == 0) {
    echo "{$green}✅ ALL TESTS PASSED - Network access is working perfectly!{$reset}\n\n";
    exit(0);
} else {
    echo "{$yellow}⚠ Some tests failed - Please check the configuration{$reset}\n\n";
    exit(1);
}

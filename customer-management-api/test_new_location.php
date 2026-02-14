<?php
/**
 * Test New Location - GiftTrack
 */

$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$blue = "\033[34m";
$reset = "\033[0m";

echo "\n";
echo str_repeat("=", 70) . "\n";
echo "  TESTING NEW LOCATION: /gifttrack/customer-management-api\n";
echo str_repeat("=", 70) . "\n\n";

$baseUrls = [
    'Localhost' => 'http://localhost/gifttrack/customer-management-api/api',
    'Local IP' => 'http://192.168.1.4/gifttrack/customer-management-api/api'
];

$passed = 0;
$failed = 0;

foreach ($baseUrls as $name => $baseUrl) {
    echo "{$blue}Testing via {$name}: {$baseUrl}{$reset}\n";
    echo str_repeat("-", 70) . "\n";
    
    // Test 1: Health endpoint
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "{$baseUrl}/health");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "{$green}✓{$reset} Health endpoint working\n";
        $passed++;
    } else {
        echo "{$red}✗{$reset} Health endpoint failed (HTTP {$httpCode})\n";
        $failed++;
    }
    
    // Test 2: Login
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "{$baseUrl}/auth/login");
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
    curl_close($ch);
    
    if ($httpCode == 200) {
        $data = json_decode($response, true);
        if ($data && $data['success'] && isset($data['data']['token'])) {
            echo "{$green}✓{$reset} Login working\n";
            $token = $data['data']['token'];
            $passed++;
            
            // Test 3: Protected endpoint
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "{$baseUrl}/customers");
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
                echo "{$green}✓{$reset} Protected endpoints working\n";
                $passed++;
            } else {
                echo "{$red}✗{$reset} Protected endpoints failed (HTTP {$httpCode})\n";
                $failed++;
            }
        } else {
            echo "{$red}✗{$reset} Login response invalid\n";
            $failed++;
        }
    } else {
        echo "{$red}✗{$reset} Login failed (HTTP {$httpCode})\n";
        if ($response) {
            $data = json_decode($response, true);
            if ($data && isset($data['error'])) {
                echo "  Error: {$data['error']}\n";
            }
        }
        $failed++;
    }
    
    echo "\n";
}

echo str_repeat("=", 70) . "\n";
echo "  SUMMARY\n";
echo str_repeat("=", 70) . "\n";
echo sprintf("Total Tests:  %d\n", $passed + $failed);
echo sprintf("{$green}Passed:       %d{$reset}\n", $passed);
echo sprintf("{$red}Failed:       %d{$reset}\n", $failed);
echo str_repeat("=", 70) . "\n\n";

if ($passed == 6) {
    echo "{$green}✅ SUCCESS! All endpoints working at new location{$reset}\n\n";
    
    echo "{$blue}📱 Update your Mobile App configuration:{$reset}\n";
    echo str_repeat("-", 70) . "\n";
    echo "const API_BASE_URL = 'http://192.168.1.4/gifttrack/customer-management-api/api';\n\n";
    
    echo "{$blue}🌐 New Access URLs:{$reset}\n";
    echo str_repeat("-", 70) . "\n";
    echo "Localhost: http://localhost/gifttrack/customer-management-api/api\n";
    echo "Network:   http://192.168.1.4/gifttrack/customer-management-api/api\n";
    echo "Health:    http://192.168.1.4/gifttrack/customer-management-api/api/health\n\n";
    
    exit(0);
} else {
    echo "{$red}⚠ Some tests failed. Please check the configuration.{$reset}\n\n";
    exit(1);
}

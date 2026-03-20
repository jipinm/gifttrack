<?php
$base = 'http://localhost/gifttrack/customer-management-api';

$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>'{"mobileNumber":"9999999999","password":"Admin@123"}',CURLOPT_HTTPHEADER=>['Content-Type: application/json']]);
$login = json_decode(curl_exec($ch), true);
$token = $login['data']['token'] ?? '';
curl_close($ch);

echo "Token: " . (empty($token) ? "MISSING" : "OK") . "\n\n";

foreach (['/api/master/care-of-options', '/api/events'] as $ep) {
    $ch = curl_init("$base$ep");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>["Authorization: Bearer $token", "Accept: application/json"]]);
    $raw = curl_exec($ch);
    curl_close($ch);
    echo "=== $ep ===\n" . substr($raw, 0, 600) . "\n\n";
}

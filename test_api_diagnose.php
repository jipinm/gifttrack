<?php
$base = 'http://localhost/gifttrack/customer-management-api';

// Login
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>'{"mobileNumber":"9999999999","password":"Admin@123"}',CURLOPT_HTTPHEADER=>['Content-Type: application/json']]);
$login = json_decode(curl_exec($ch), true);
$token = $login['data']['token'] ?? '';
curl_close($ch);
echo "Token: " . (empty($token) ? "MISSING" : substr($token, 0, 20) . "...") . "\n\n";

function rawGet($url, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>["Authorization: Bearer $token", "Accept: application/json"]]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($resp, true);
    echo "HTTP $code | success=" . var_export($data['success'] ?? 'MISSING', true) . " | keys=" . implode(',', is_array($data) ? array_keys($data) : []) . "\n";
    if (isset($data['data'])) echo "  data type=" . gettype($data['data']) . " | " . (is_array($data['data']) ? "count=".count($data['data']) : json_encode($data['data'])) . "\n";
    return $data;
}

echo "--- /api/master/care-of-options ---\n";
rawGet("$base/api/master/care-of-options", $token);

echo "\n--- /api/events ---\n";
rawGet("$base/api/events", $token);

echo "\n--- /api/events (paginated) ---\n";
rawGet("$base/api/events?page=1&perPage=5", $token);

echo "\n--- /api/gifts (GET) ---\n";
rawGet("$base/api/gifts", $token);

echo "\n--- /api/gifts/customer-gifts (GET) ---\n";
rawGet("$base/api/gifts/customer-gifts", $token);

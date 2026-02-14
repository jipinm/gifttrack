<?php
$ch = curl_init('http://customer-management-api.local/api/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'mobileNumber' => '9999999999',
    'password' => 'Admin@123'
]));

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Status: $status\n";
if ($error) {
    echo "cURL Error: $error\n";
}
echo "Response:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
echo "\n\n";

$data = json_decode($response, true);
echo "Token path 1 (\$data['token']): " . ($data['token'] ?? 'NOT FOUND') . "\n";
echo "Token path 2 (\$data['data']['token']): " . ($data['data']['token'] ?? 'NOT FOUND') . "\n";

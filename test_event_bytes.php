<?php
$base = 'http://localhost/gifttrack/customer-management-api';
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>'{"mobileNumber":"9999999999","password":"Admin@123"}',
    CURLOPT_HTTPHEADER=>['Content-Type: application/json']]);
$login = json_decode(curl_exec($ch), true);
$token = $login['data']['token'] ?? '';
curl_close($ch);

// Get event type
$ch = curl_init("$base/api/master/event-types");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>["Authorization: Bearer $token"]]);
$etResp = json_decode(curl_exec($ch), true);
curl_close($ch);
$firstTypeId = $etResp['data'][0]['id'] ?? 1;

// POST event
$ch = curl_init("$base/api/events");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>json_encode(['name'=>'Test2','eventDate'=>date('Y-m-d',strtotime('+1 day')),'eventTypeId'=>$firstTypeId,'eventCategory'=>'self_event']),
    CURLOPT_HTTPHEADER=>["Authorization: Bearer $token",'Content-Type: application/json']]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP $code\n";
echo "First 20 bytes hex: " . bin2hex(substr($resp, 0, 20)) . "\n";
echo "json_last_error: " . json_last_error() . " = " . json_last_error_msg() . "\n";
$data = json_decode($resp, true);
echo "json_decode result: " . var_export($data, true) . "\n";

// Cleanup
if ($data && isset($data['data']['id'])) {
    $ch = curl_init("$base/api/events/delete?id=" . $data['data']['id']);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_CUSTOMREQUEST=>'DELETE',CURLOPT_HTTPHEADER=>["Authorization: Bearer $token"]]);
    curl_exec($ch); curl_close($ch); echo "Cleaned up.\n";
}

<?php
/**
 * Test Add Event (POST /api/events) 500 error
 */
$base = 'http://localhost/gifttrack/customer-management-api';

// Login
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>'{"mobileNumber":"9999999999","password":"Admin@123"}',
    CURLOPT_HTTPHEADER=>['Content-Type: application/json']]);
$login = json_decode(curl_exec($ch), true);
$token = $login['data']['token'] ?? '';
curl_close($ch);
echo "Login: " . ($token ? "OK" : "FAILED") . "\n\n";

// Get a valid event type ID first
$ch = curl_init("$base/api/master/event-types");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>["Authorization: Bearer $token", 'Accept: application/json']]);
$etResp = json_decode(curl_exec($ch), true);
curl_close($ch);
$eventTypes = $etResp['data'] ?? [];
$firstTypeId = !empty($eventTypes) ? $eventTypes[0]['id'] : 1;
echo "Event types count: " . count($eventTypes) . ", using ID: $firstTypeId\n\n";

// Test POST /api/events
$eventPayload = json_encode([
    'name' => 'Test Event from API',
    'eventDate' => date('Y-m-d', strtotime('+7 days')),
    'eventTypeId' => $firstTypeId,
    'eventCategory' => 'self_event',
    'notes' => 'Test notes',
]);
$ch = curl_init("$base/api/events");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>$eventPayload,
    CURLOPT_HTTPHEADER=>["Authorization: Bearer $token", 'Content-Type: application/json', 'Accept: application/json']]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "POST /api/events => HTTP $code\n";
$data = json_decode($resp, true);
if ($data) {
    echo "success: " . var_export($data['success'], true) . "\n";
    if ($data['success']) {
        echo "Created event ID: " . ($data['data']['id'] ?? 'N/A') . "\n";
        // Clean up - delete the test event
        $testEventId = $data['data']['id'] ?? null;
        if ($testEventId) {
            $ch = curl_init("$base/api/events/delete?id=$testEventId");
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_CUSTOMREQUEST=>'DELETE',
                CURLOPT_HTTPHEADER=>["Authorization: Bearer $token"]]);
            $delResp = json_decode(curl_exec($ch), true);
            curl_close($ch);
            echo "Cleanup delete: " . var_export($delResp['success'] ?? false, true) . "\n";
        }
    } else {
        echo "Error: " . ($data['message'] ?? $data['error'] ?? 'unknown') . "\n";
        if (isset($data['errors'])) echo "Errors: " . json_encode($data['errors']) . "\n";
    }
} else {
    echo "Raw response (first 500 chars):\n" . substr($resp, 0, 500) . "\n";
}

echo "\n--- Also test with customer_event category ---\n";
$ch = curl_init("$base/api/events");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>json_encode(['name'=>'Customer Event Test','eventDate'=>date('Y-m-d',strtotime('+7 days')),'eventTypeId'=>$firstTypeId,'eventCategory'=>'customer_event']),
    CURLOPT_HTTPHEADER=>["Authorization: Bearer $token",'Content-Type: application/json','Accept: application/json']]);
$resp2 = curl_exec($ch);
$code2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data2 = json_decode($resp2, true);
echo "POST /api/events (customer_event) => HTTP $code2 | success=" . var_export($data2['success'] ?? 'MISSING', true) . "\n";
if ($data2 && $data2['success'] && isset($data2['data']['id'])) {
    $ch = curl_init("$base/api/events/delete?id=" . $data2['data']['id']);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_CUSTOMREQUEST=>'DELETE', CURLOPT_HTTPHEADER=>["Authorization: Bearer $token"]]);
    curl_exec($ch); curl_close($ch);
}

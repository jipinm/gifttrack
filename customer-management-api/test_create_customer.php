<?php
// Test Create Customer endpoint
echo "Testing POST /api/customers\n\n";

// Login first
$loginResult = shell_exec('curl -s -X POST http://customer-management-api.local/api/auth/login -H "Content-Type: application/json" -d "{\"mobile_number\":\"9999999999\",\"password\":\"Admin@123\"}"');
$login = json_decode($loginResult, true);
$token = $login['data']['token'];
echo "Token obtained\n\n";

// Create customer
$customerData = [
    'name' => 'Test Customer',
    'mobileNumber' => '9876543210',
    'address' => 'Test Address, Street 123',
    'stateId' => 1,
    'districtId' => 1,
    'cityId' => 1,
    'eventTypeId' => 1,
    'eventDate' => '2026-06-15',
    'invitationStatusId' => 2,
    'notes' => 'Test customer'
];

// Write data to temp file
$tmpFile = tempnam(sys_get_temp_dir(), 'customer_');
file_put_contents($tmpFile, json_encode($customerData));

$cmd = 'curl -s -X POST http://customer-management-api.local/api/customers -H "Authorization: Bearer ' . $token . '" -H "Content-Type: application/json" --data-binary @' . $tmpFile;
$result = shell_exec($cmd);

unlink($tmpFile);

echo "Response:\n";
echo $result . "\n";

$response = json_decode($result, true);
if ($response['success']) {
    echo "\n✓ Customer created successfully!\n";
    echo "Customer ID: " . $response['data']['id'] . "\n";
} else {
    echo "\n✗ Failed: " . $response['error'] . "\n";
}

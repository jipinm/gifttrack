<?php
/**
 * Test Import API endpoint
 * Creates a sample Excel file, POSTs it to the import endpoint, and shows results.
 */
require 'c:/xampp/htdocs/gifttrack/customer-management-api/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$base = 'http://localhost/gifttrack/customer-management-api';

// ── Login ──────────────────────────────────────────────────────────────────
$ch = curl_init("$base/api/auth/login");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
    CURLOPT_POSTFIELDS=>'{"mobileNumber":"9999999999","password":"Admin@123"}',
    CURLOPT_HTTPHEADER=>['Content-Type: application/json']]);
$login = json_decode(curl_exec($ch), true);
$token = $login['data']['token'] ?? '';
curl_close($ch);
echo "Token: " . ($token ? "OK" : "FAILED") . "\n\n";

// ── Build sample Excel file ────────────────────────────────────────────────
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// Headers
$sheet->fromArray([[
    'Name', 'Mobile Number', 'Address', 'State', 'District', 'City', 'Notes',
    'Event Name', 'Invitation Status', 'Care Of', 'Gift Type', 'Gift Amount', 'Gift Description',
]], null, 'A1');

// Valid rows
$sheet->fromArray([
    ['Import Test User 1', '9876543210', 'Test Address 1', 'Kerala', 'Ernakulam', 'Kochi', 'Imported row 1', null, null, null, null, null, null],
    ['Import Test User 2', null,         'Test Address 2', 'Kerala', 'Kannur',    'Kannur', null,             null, null, null, null, null, null],
    ['Import Test User 3', '8765432109', 'Test Address 3', 'Kerala', 'Kozhikode', 'Kozhikode', 'Note here', null, null, null, null, null, null],
], null, 'A2');

// Error rows (should fail)
$sheet->fromArray([
    ['',                   '1234567890', 'Addr 4', 'Kerala', 'Ernakulam', 'Kochi', null, null, null, null, null, null, null], // missing name
    ['Bad Mobile Num',     'ABC12345',   'Addr 5', 'Kerala', 'Ernakulam', 'Kochi', null, null, null, null, null, null, null], // bad mobile
    ['Bad District',       null,         'Addr 6', 'Kerala', 'NoDistrict','Kochi', null, null, null, null, null, null, null], // bad district
], null, 'A5');

$tmpFile = sys_get_temp_dir() . '/import_test.xlsx';
$writer = new Xlsx($spreadsheet);
$writer->save($tmpFile);
echo "Sample file created: $tmpFile\n\n";

// ── Upload to API ──────────────────────────────────────────────────────────
$ch = curl_init("$base/api/customers/import");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => ['file' => new CURLFile($tmpFile, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'import_test.xlsx')],
    CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP $code\n";
$data = json_decode($resp, true);
if ($data) {
    echo "success: " . var_export($data['success'], true) . "\n";
    echo "message: " . ($data['message'] ?? '') . "\n";
    if (isset($data['data'])) {
        $d = $data['data'];
        echo "total:    " . $d['total'] . "\n";
        echo "imported: " . $d['imported'] . "\n";
        echo "failed:   " . $d['failed'] . "\n";
        if (!empty($d['errors'])) {
            echo "\nFailed rows:\n";
            foreach ($d['errors'] as $err) {
                echo "  Row {$err['row']} [{$err['name']}]: " . implode('; ', $err['errors']) . "\n";
            }
        }
    }
} else {
    echo "Raw (first 500): " . substr($resp, 0, 500) . "\n";
}

// Cleanup test customers created
if (isset($data['data']['imported']) && $data['data']['imported'] > 0) {
    $cleanDb = new PDO('mysql:host=127.0.0.1;dbname=customer_management_db', 'root', '');
    $cleanDb->exec("DELETE FROM customers WHERE name IN ('Import Test User 1','Import Test User 2','Import Test User 3')");
    echo "\nTest customers cleaned up.\n";
}

@unlink($tmpFile);

require_once __DIR__ . '/customer-management-api/bootstrap.php';
$db = Database::getInstance()->getConnection();
$stmt = $db->query("SELECT id, name FROM event_types WHERE is_active = 1 ORDER BY id ASC");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Event Types:\n";
echo json_encode($data, JSON_PRETTY_PRINT);
echo "\nCount: " . count($data) . "\n";

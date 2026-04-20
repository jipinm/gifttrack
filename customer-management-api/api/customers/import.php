<?php
/**
 * Customer Import Endpoint
 * POST /api/customers/import
 *
 * Upload an Excel (.xlsx / .xls) file and bulk-import customers.
 * Optional columns allow attaching customers to existing events with
 * invitation status, care-of, and gift data.
 *
 * Expected Excel columns (case-insensitive):
 *   Required : Name, Address, State, District, City
 *   Optional : Mobile Number, Notes,
 *              Event Name, Event Date, Invitation Status, Care Of,
 *              Gift Type, Gift Amount, Gift Description
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Customer.php';
require_once __DIR__ . '/../../models/Event.php';
require_once __DIR__ . '/../../models/Gift.php';
require_once __DIR__ . '/../../utils/Database.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;

global $authUser;

if (!$authUser) {
    Response::error('Not authenticated', 401);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD']);

if ($method !== 'POST') {
    Response::methodNotAllowed();
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Validate file upload
// ─────────────────────────────────────────────────────────────────────────────
if (empty($_FILES['file'])) {
    Response::error('No file uploaded. Send the Excel file as multipart/form-data with field name "file".', 400);
    exit;
}

$uploadedFile = $_FILES['file'];

if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize in php.ini',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE in form',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Temporary folder is missing',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the upload',
    ];
    $msg = $uploadErrors[$uploadedFile['error']] ?? 'Unknown upload error';
    Response::error($msg, 400);
    exit;
}

$originalName = $uploadedFile['name'];
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($ext, ['xlsx', 'xls'], true)) {
    Response::error('Invalid file type. Only .xlsx and .xls files are accepted.', 400);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Load the spreadsheet
// ─────────────────────────────────────────────────────────────────────────────
try {
    $reader = IOFactory::createReaderForFile($uploadedFile['tmp_name']);
    $reader->setReadDataOnly(true);
    $spreadsheet = $reader->load($uploadedFile['tmp_name']);
} catch (\Throwable $e) {
    Response::error('Could not read the Excel file. Make sure it is a valid .xlsx or .xls document.', 400);
    exit;
}

$sheet = $spreadsheet->getActiveSheet();
$rows  = $sheet->toArray(null, true, true, false); // 0-indexed rows

if (empty($rows) || count($rows) < 2) {
    Response::error('The file is empty or contains only headers.', 400);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Parse & validate headers (first row)
// ─────────────────────────────────────────────────────────────────────────────
$rawHeaders = array_map(fn($h) => trim((string)$h), $rows[0]);

// Normalise: lowercase, replace spaces/underscores
$normaliseHeader = fn(string $h): string => preg_replace('/[\s_]+/', '', strtolower($h));

$normHeaders = array_map($normaliseHeader, $rawHeaders);

// Map normalised name → column index
$colMap = [];
foreach ($normHeaders as $idx => $norm) {
    $colMap[$norm] = $idx;
}

// Aliases for flexible column-name matching
$aliases = [
    'name'              => ['name', 'customername', 'fullname'],
    'mobile'            => ['mobilenumber', 'mobile', 'phone', 'contact', 'phonenumber'],
    'address'           => ['address', 'addr'],
    'state'             => ['state', 'statename'],
    'district'          => ['district', 'districtname'],
    'city'              => ['city', 'cityname', 'town'],
    'notes'             => ['notes', 'note', 'remarks', 'comments'],
    'eventname'         => ['eventname', 'event', 'eventtitle'],
    'eventdate'         => ['eventdate', 'date', 'eventday'],
    'invitationstatus'  => ['invitationstatus', 'invitation', 'status'],
    'careof'            => ['careof', 'care', 'careofname'],
    'gifttype'          => ['gifttype', 'gift', 'giftname'],
    'giftamount'        => ['giftamount', 'amount', 'value', 'giftvalue'],
    'giftdescription'   => ['giftdescription', 'giftdesc', 'description'],
    'attendees'         => ['numberofattendees', 'attendees', 'attendeecount', 'numattendees', 'noofattendees'],
];

$resolvedCols = [];
foreach ($aliases as $field => $candidates) {
    foreach ($candidates as $candidate) {
        if (array_key_exists($candidate, $colMap)) {
            $resolvedCols[$field] = $colMap[$candidate];
            break;
        }
    }
}

// Required column check
$requiredFields = ['name', 'address', 'state', 'district', 'city'];
$missingCols = [];
foreach ($requiredFields as $req) {
    if (!isset($resolvedCols[$req])) {
        $missingCols[] = ucfirst($req);
    }
}
if (!empty($missingCols)) {
    Response::error('Missing required columns: ' . implode(', ', $missingCols) . '. Required columns are: Name, Address, State, District, City.', 400);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Load master data for lookups (once, reused per row)
// ─────────────────────────────────────────────────────────────────────────────
$db   = Database::getInstance()->getConnection();

$states    = $db->query("SELECT LOWER(name) AS lname, id FROM states")->fetchAll(PDO::FETCH_KEY_PAIR);
$districts = $db->query("SELECT id, LOWER(CONCAT(name, '|', state_id)) AS key_name, state_id, name FROM districts")->fetchAll(PDO::FETCH_ASSOC);
$cities    = $db->query("SELECT id, LOWER(CONCAT(name, '|', district_id)) AS key_name, district_id, name FROM cities")->fetchAll(PDO::FETCH_ASSOC);

// Index for fast lookup
$districtIdx = []; // "name|state_id" => id
foreach ($districts as $d) {
    $districtIdx[strtolower($d['name']) . '|' . $d['state_id']] = (int)$d['id'];
}
$cityIdx = []; // "name|district_id" => id
foreach ($cities as $c) {
    $cityIdx[strtolower($c['name']) . '|' . $c['district_id']] = (int)$c['id'];
}

// Invitation status: name => id
$invStatuses = $db->query("SELECT LOWER(name) AS lname, id FROM invitation_status WHERE is_active = 1")->fetchAll(PDO::FETCH_KEY_PAIR);

// Care of options: name => id (global defaults + created by auth user)
$careOfStmt = $db->prepare("SELECT LOWER(name) AS lname, id FROM care_of_options WHERE is_active = 1 AND (created_by IS NULL OR created_by = :userId)");
$careOfStmt->execute(['userId' => $authUser['id']]);
$careOfOptions = $careOfStmt->fetchAll(PDO::FETCH_KEY_PAIR);

// Gift types: name => id
$giftTypes = $db->query("SELECT LOWER(name) AS lname, id FROM gift_types WHERE is_active = 1")->fetchAll(PDO::FETCH_KEY_PAIR);

// Events: name (lower) => array of events (there may be multiple with same name)
$eventStmt = $db->prepare("SELECT id, name FROM events WHERE deleted_at IS NULL AND created_by = :createdBy");
$eventStmt->execute(['createdBy' => $authUser['id']]);
$eventsByName = [];
foreach ($eventStmt->fetchAll(PDO::FETCH_ASSOC) as $ev) {
    $eventsByName[strtolower(trim($ev['name']))][] = $ev['id'];
}

// Default invitation status (the one marked is_default = 1)
$defaultInvStatusRow = $db->query("SELECT id FROM invitation_status WHERE is_default = 1 LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$defaultInvStatusId  = $defaultInvStatusRow ? (int)$defaultInvStatusRow['id'] : 1;

// ─────────────────────────────────────────────────────────────────────────────
// 5. Process rows
// ─────────────────────────────────────────────────────────────────────────────
$customerModel = new Customer();
$giftModel     = new Gift();

$totalRows = 0;
$imported  = 0;
$failed    = 0;
$errors    = [];

// Helper: get cell value safely
$cell = function (array $row, ?int $idx): string {
    if ($idx === null || !array_key_exists($idx, $row)) return '';
    return trim((string)($row[$idx] ?? ''));
};

// Skip header row (index 0)
$dataRows = array_slice($rows, 1);

foreach ($dataRows as $rowIndex => $row) {
    $excelRow = $rowIndex + 2; // 1-based, +1 for header

    // Skip completely empty rows
    $rowValues = array_filter(array_map('trim', array_map('strval', $row)));
    if (empty($rowValues)) {
        continue;
    }

    $totalRows++;
    $rowErrors = [];

    // ---- Required fields ----
    $name    = $cell($row, $resolvedCols['name']);
    $address = $cell($row, $resolvedCols['address']);
    $stateName    = $cell($row, $resolvedCols['state']);
    $districtName = $cell($row, $resolvedCols['district']);
    $cityName     = $cell($row, $resolvedCols['city']);

    // ---- Optional customer fields ----
    $mobile = $cell($row, $resolvedCols['mobile'] ?? null);
    $notes  = $cell($row, $resolvedCols['notes'] ?? null);

    // ---- Optional event/gift fields ----
    $eventNameRaw       = $cell($row, $resolvedCols['eventname'] ?? null);
    $invitationRaw      = $cell($row, $resolvedCols['invitationstatus'] ?? null);
    $careOfRaw          = $cell($row, $resolvedCols['careof'] ?? null);
    $giftTypeRaw        = $cell($row, $resolvedCols['gifttype'] ?? null);
    $giftAmountRaw      = $cell($row, $resolvedCols['giftamount'] ?? null);
    $giftDescriptionRaw = $cell($row, $resolvedCols['giftdescription'] ?? null);
    $attendeesRaw       = $cell($row, $resolvedCols['attendees'] ?? null);

    // Validate required fields
    if (empty($name)) {
        $rowErrors[] = 'Name is required';
    } elseif (mb_strlen($name) > 255) {
        $rowErrors[] = 'Name must not exceed 255 characters';
    }

    if (empty($address)) {
        $rowErrors[] = 'Address is required';
    }

    if (!empty($mobile) && !preg_match('/^\d{10}$/', $mobile)) {
        $rowErrors[] = 'Mobile number must be exactly 10 digits';
    }

    // Resolve state
    $stateId = null;
    if (empty($stateName)) {
        $rowErrors[] = 'State is required';
    } else {
        $stateId = $states[strtolower($stateName)] ?? null;
        if ($stateId === null) {
            $rowErrors[] = "State not found: \"$stateName\"";
        }
    }

    // Resolve district
    $districtId = null;
    if (empty($districtName)) {
        $rowErrors[] = 'District is required';
    } elseif ($stateId !== null) {
        $districtKey = strtolower($districtName) . '|' . $stateId;
        $districtId  = $districtIdx[$districtKey] ?? null;
        if ($districtId === null) {
            $rowErrors[] = "District not found: \"$districtName\" in state \"$stateName\"";
        }
    }

    // Resolve city
    $cityId = null;
    if (empty($cityName)) {
        $rowErrors[] = 'City is required';
    } elseif ($districtId !== null) {
        $cityKey = strtolower($cityName) . '|' . $districtId;
        $cityId  = $cityIdx[$cityKey] ?? null;
        if ($cityId === null) {
            $rowErrors[] = "City not found: \"$cityName\" in district \"$districtName\"";
        }
    }

    // If any required field failed, record error and continue
    if (!empty($rowErrors)) {
        $failed++;
        $errors[] = [
            'row'   => $excelRow,
            'name'  => $name ?: "(empty)",
            'errors' => $rowErrors,
        ];
        continue;
    }

    // ── Check duplicate mobile (within the importing user's customers) ──
    if (!empty($mobile)) {
        $dupStmt = $db->prepare(
            "SELECT id FROM customers WHERE mobile_number = :mobile AND created_by = :createdBy LIMIT 1"
        );
        $dupStmt->execute(['mobile' => $mobile, 'createdBy' => $authUser['id']]);
        if ($dupStmt->fetch()) {
            $failed++;
            $errors[] = [
                'row'    => $excelRow,
                'name'   => $name,
                'errors' => ["Duplicate mobile number: $mobile — customer already exists"],
            ];
            continue;
        }
    }

    // ── Insert customer ──
    $resolvedAttendeeCount = ($attendeesRaw !== '' && ctype_digit((string)$attendeesRaw)) ? max(1, (int)$attendeesRaw) : 1;
    $customerId = $customerModel->create([
        'name'          => $name,
        'mobileNumber'  => $mobile ?: null,
        'address'       => $address,
        'stateId'       => $stateId,
        'districtId'    => $districtId,
        'cityId'        => $cityId,
        'notes'         => $notes ?: null,
        'attendeeCount' => $resolvedAttendeeCount,
        'createdBy'     => $authUser['id'],
    ]);

    if (!$customerId) {
        $failed++;
        $errors[] = [
            'row'    => $excelRow,
            'name'   => $name,
            'errors' => ['Failed to save customer to database'],
        ];
        continue;
    }

    // ── Optional: attach to event ──
    if (!empty($eventNameRaw)) {
        $eventKey    = strtolower(trim($eventNameRaw));
        $matchingIds = $eventsByName[$eventKey] ?? [];
        $eventId     = !empty($matchingIds) ? $matchingIds[0] : null;

        if ($eventId) {
            // Resolve invitation status
            $invStatusId = $defaultInvStatusId;
            if (!empty($invitationRaw)) {
                $found = $invStatuses[strtolower($invitationRaw)] ?? null;
                if ($found) $invStatusId = (int)$found;
            }

            // Resolve care-of
            $careOfId = null;
            if (!empty($careOfRaw)) {
                $care = $careOfOptions[strtolower($careOfRaw)] ?? null;
                if ($care) $careOfId = (int)$care;
            }

            // Check customer not already attached to event
            $ecCheck = $db->prepare(
                "SELECT id FROM event_customers WHERE event_id = :eid AND customer_id = :cid LIMIT 1"
            );
            $ecCheck->execute(['eid' => $eventId, 'cid' => $customerId]);

            if (!$ecCheck->fetch()) {
                $ecId = generateUUID();
                // attendee_count is a snapshot of the customer's count at attachment time
                $ecStmt = $db->prepare(
                    "INSERT INTO event_customers (id, event_id, customer_id, invitation_status_id, care_of_id, attendee_count, attached_by)
                     VALUES (:id, :eventId, :customerId, :invStatusId, :careOfId, :attendeeCount, :attachedBy)"
                );
                $ecStmt->execute([
                    'id'            => $ecId,
                    'eventId'       => $eventId,
                    'customerId'    => $customerId,
                    'invStatusId'   => $invStatusId,
                    'careOfId'      => $careOfId,
                    'attendeeCount' => $resolvedAttendeeCount,
                    'attachedBy'    => $authUser['id'],
                ]);
            }

            // ── Optional: create gift ──
            if (!empty($giftAmountRaw) && !empty($giftTypeRaw)) {
                $giftAmount = (float)$giftAmountRaw;
                $gtKey      = strtolower(trim($giftTypeRaw));
                $giftTypeId = $giftTypes[$gtKey] ?? null;

                if ($giftTypeId && $giftAmount > 0) {
                    $giftId   = generateUUID();
                    $giftStmt = $db->prepare(
                        "INSERT INTO gifts (id, event_id, customer_id, gift_type_id, value, description)
                         VALUES (:id, :eventId, :customerId, :giftTypeId, :value, :description)"
                    );
                    $giftStmt->execute([
                        'id'          => $giftId,
                        'eventId'     => $eventId,
                        'customerId'  => $customerId,
                        'giftTypeId'  => (int)$giftTypeId,
                        'value'       => $giftAmount,
                        'description' => $giftDescriptionRaw ?: null,
                    ]);
                }
            }
        }
        // If event not found we silently skip the attachment (customer was still imported)
    }

    $imported++;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Return summary
// ─────────────────────────────────────────────────────────────────────────────
$message = "Import completed: $imported customer(s) imported successfully";
if ($failed > 0) {
    $message .= ", $failed row(s) failed";
}

Response::success(
    [
        'total'    => $totalRows,
        'imported' => $imported,
        'failed'   => $failed,
        'errors'   => $errors,
    ],
    $message,
    200
);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: UUID v4 generator (reuse Customer model pattern)
// ─────────────────────────────────────────────────────────────────────────────
function generateUUID(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

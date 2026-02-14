<?php

require_once __DIR__ . '/bootstrap.php';

use Utils\Database;

$db = Database::getInstance()->getConnection();

$search = '%John%';

// Test exact SQL from the log
$sql = "SELECT
            c.*,
            s.name as state_name,
            d.name as district_name,
            ct.name as city_name,
            et.name as event_type_name,
            ist.name as invitation_status_name,
            u.name as created_by_name,
            (SELECT COUNT(*) FROM gifts g WHERE g.customer_id = c.id) as gift_count,     
            COALESCE((SELECT SUM(value) FROM gifts g WHERE g.customer_id = c.id), 0) as total_gift_value                                                                                                          
        FROM customers c
            LEFT JOIN states s ON c.state_id = s.id
            LEFT JOIN districts d ON c.district_id = d.id
            LEFT JOIN cities ct ON c.city_id = ct.id
            LEFT JOIN event_types et ON c.event_type_id = et.id
            LEFT JOIN invitation_status ist ON c.invitation_status_id = ist.id
            LEFT JOIN users u ON c.created_by = u.id
            WHERE 1=1 AND (c.name LIKE :search OR c.mobile_number LIKE :search) ORDER BY c.created_at DESC";

$stmt = $db->prepare($sql);
$stmt->execute(['search' => $search]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Results found: " . count($results) . "\n";
foreach ($results as $row) {
    echo "Name: " . $row['name'] . ", Mobile: " . $row['mobile_number'] . "\n";
}

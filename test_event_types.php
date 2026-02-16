<?php
require_once __DIR__ . '/customer-management-api/bootstrap.php';
$db = Database::getInstance()->getConnection();
$stmt = $db->query("SELECT id, name FROM event_types WHERE is_active = 1 ORDER BY id ASC");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Event Types:\n";
echo json_encode($data, JSON_PRETTY_PRINT);
echo "\nCount: " . count($data) . "\n";

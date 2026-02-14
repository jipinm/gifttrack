<?php
require_once __DIR__ . '/bootstrap.php';

echo "Testing password 'Admin@123' against user hashes:\n";
echo str_repeat('-', 70) . "\n";

$db = Database::getInstance()->getConnection();
$users = $db->query('SELECT id, name, mobile_number, role, password FROM users')->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    $isValid = password_verify('Admin@123', $user['password']);
    echo sprintf("%-15s (%-20s): %s\n", 
        $user['mobile_number'], 
        $user['name'],
        $isValid ? "✓ Valid" : "✗ Invalid"
    );
}

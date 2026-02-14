<?php
require_once __DIR__ . '/bootstrap.php';

$db = Database::getInstance()->getConnection();

echo "Users in database:\n";
echo str_repeat('-', 70) . "\n";

$users = $db->query('SELECT id, name, mobile_number, role, password FROM users')->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    echo "Name: {$user['name']}\n";
    echo "Mobile: {$user['mobile_number']}\n";
    echo "Role: {$user['role']}\n";
    echo "Password Hash: " . substr($user['password'], 0, 30) . "...\n";
    echo "\n";
}

// Test password verification
echo "\nTesting password 'password' against hashes:\n";
echo str_repeat('-', 70) . "\n";

foreach ($users as $user) {
    $isValid = password_verify('password', $user['password']);
    echo "{$user['mobile_number']}: " . ($isValid ? "✓ Valid" : "✗ Invalid") . "\n";
}

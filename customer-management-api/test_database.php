<?php
/**
 * Test database connection and tables
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "✓ Database connection: SUCCESS\n\n";
    
    // Get all tables
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Database tables found: " . count($tables) . "\n";
    echo str_repeat('-', 50) . "\n";
    
    foreach($tables as $table) {
        // Get row count for each table
        $count = $db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo sprintf("  %-30s %6d rows\n", $table, $count);
    }
    
    echo "\n";
    
    // Test admin user
    echo "Checking admin users:\n";
    echo str_repeat('-', 50) . "\n";
    $users = $db->query("SELECT id, name, mobile_number, role FROM users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    foreach($users as $user) {
        echo sprintf("  %s (%s) - %s - Role: %s\n", $user['id'], $user['name'], $user['mobile_number'], $user['role']);
    }
    
} catch(Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

<?php
/**
 * Reset All Admin Passwords
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // New password
    $newPassword = 'Admin@123';
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    
    echo "Resetting all user passwords to: {$newPassword}\n";
    echo str_repeat('-', 70) . "\n";
    
    // Get all users
    $users = $db->query('SELECT id, name, mobile_number FROM users')->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        $stmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
        $stmt->execute([
            ':password' => $hashedPassword,
            ':id' => $user['id']
        ]);
        
        echo "✓ Updated password for {$user['name']} ({$user['mobile_number']})\n";
    }
    
    echo "\n✅ All passwords have been reset successfully!\n";
    echo "Password: {$newPassword}\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

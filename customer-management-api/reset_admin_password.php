<?php
/**
 * Reset Admin Password Script
 * Run this file once via browser: http://localhost/customer-management-api/reset_admin_password.php
 * Then DELETE this file for security
 */

require_once __DIR__ . '/bootstrap.php';

use CustomerManagement\Utils\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    // New password
    $newPassword = 'Admin@123';
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    
    // Mobile number to reset
    $mobileNumber = '9999999999';
    
    // Update password
    $stmt = $db->prepare("
        UPDATE users 
        SET password = :password, updated_at = NOW() 
        WHERE mobile_number = :mobile_number
    ");
    
    $stmt->execute([
        ':password' => $hashedPassword,
        ':mobile_number' => $mobileNumber
    ]);
    
    if ($stmt->rowCount() > 0) {
        echo "✅ Password successfully reset for user: {$mobileNumber}\n";
        echo "New password: {$newPassword}\n";
        echo "\n⚠️ IMPORTANT: DELETE this file immediately for security!\n";
    } else {
        echo "❌ User not found with mobile number: {$mobileNumber}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

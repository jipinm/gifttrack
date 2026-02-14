<?php
/**
 * Change Password Endpoint
 * POST /api/auth/change-password
 * 
 * Allows authenticated users to change their password
 * Requires current password verification before updating
 */

// Load bootstrap
require_once __DIR__ . '/../../bootstrap.php';

// Load middleware (this runs authentication automatically)
require_once __DIR__ . '/../../middleware/auth.php';

// Load User model
require_once __DIR__ . '/../../models/User.php';

// Get authenticated user from middleware
global $authUser;
if (!$authUser) {
    Response::error('Not authenticated', 401);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Support both camelCase and snake_case
    $currentPassword = $input['current_password'] ?? $input['currentPassword'] ?? null;
    $newPassword = $input['new_password'] ?? $input['newPassword'] ?? null;
    $confirmPassword = $input['confirm_password'] ?? $input['confirmPassword'] ?? null;
    
    // Validate required fields
    if (!$currentPassword) {
        Response::error('Current password is required', 400);
    }
    
    if (!$newPassword) {
        Response::error('New password is required', 400);
    }
    
    if (!$confirmPassword) {
        Response::error('Password confirmation is required', 400);
    }
    
    // Validate new password matches confirmation
    if ($newPassword !== $confirmPassword) {
        Response::error('New password and confirmation do not match', 400);
    }
    
    // Validate new password strength (minimum 6 characters)
    if (strlen($newPassword) < 6) {
        Response::error('New password must be at least 6 characters long', 400);
    }
    
    // Get user model
    $userModel = new User();
    
    // Get current user with password hash using mobile number from token
    $user = $userModel->findByMobileNumber($authUser['mobileNumber']);
    
    if (!$user) {
        Response::error('User not found', 404);
    }
    
    // Verify current password
    if (!$userModel->verifyPassword($currentPassword, $user['password'])) {
        Response::error('Current password is incorrect', 400);
    }
    
    // Check if new password is same as current password
    if ($userModel->verifyPassword($newPassword, $user['password'])) {
        Response::error('New password must be different from current password', 400);
    }
    
    // Update password using user ID from database
    $success = $userModel->update($user['id'], [
        'password' => $newPassword
    ]);
    
    if (!$success) {
        Response::error('Failed to update password', 500);
    }
    
    Response::success(null, 'Password changed successfully');

} catch (Exception $e) {
    error_log("Change password error: " . $e->getMessage());
    Response::error('An error occurred while changing password', 500);
}

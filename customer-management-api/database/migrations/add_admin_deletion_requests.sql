-- ============================================================
-- Migration: Add admin_deletion_requests table
-- Feature: Admin Account Deletion Request Workflow
-- Date: 2026-04-19
-- Description: Allows admins to request account deletion.
--              Super Admin reviews and approves/rejects requests.
-- ============================================================

-- Create the admin_deletion_requests table
CREATE TABLE IF NOT EXISTS `admin_deletion_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(36) NOT NULL COMMENT 'FK to users table (admin only)',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT 'Request status',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Request submitted time',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last updated time',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `admin_deletion_requests_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

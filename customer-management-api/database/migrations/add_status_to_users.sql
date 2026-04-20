-- ============================================================
-- Migration: Add registration status to users table
-- Feature: Admin Open Registration with Super Admin Approval
-- Date: 2026-04-19
-- ============================================================
-- NOTE: Run this script once against customer_management_db.
--       Existing users are defaulted to 'approved' so the
--       current login flow is NOT affected.
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Registration approval status. pending = awaiting approval, approved = can log in, rejected = access denied'
    AFTER `role`;

-- Back-fill: all existing users are already active → approved
UPDATE `users` SET `status` = 'approved' WHERE `status` IS NULL OR `status` = '';

-- Index for fast status-based queries
CREATE INDEX `idx_users_status` ON `users` (`status`);

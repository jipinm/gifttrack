-- Migration: Add soft delete support to events table
-- This adds a deleted_at column for safe delete functionality

ALTER TABLE `events` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`;
ALTER TABLE `events` ADD INDEX `idx_events_deleted_at` (`deleted_at`);

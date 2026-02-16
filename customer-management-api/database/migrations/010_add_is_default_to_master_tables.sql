-- Migration: Add is_default column to master data tables
-- Date: 2026-02-16
-- Description: Allows configuring a default option per master data type

ALTER TABLE `event_types` ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`;
ALTER TABLE `gift_types` ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`;
ALTER TABLE `invitation_status` ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`;
ALTER TABLE `care_of_options` ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`;

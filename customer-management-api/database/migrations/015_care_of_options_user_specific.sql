-- Migration: Make care_of_options user-specific
-- Each admin/superadmin can have their own care-of options
-- NULL created_by = system-level options (visible to all as defaults)

-- Add created_by column to care_of_options
ALTER TABLE `care_of_options` 
ADD COLUMN `created_by` varchar(36) NULL DEFAULT NULL AFTER `is_default`,
ADD CONSTRAINT `care_of_options_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Add index for performance on created_by lookups
ALTER TABLE `care_of_options`
ADD KEY `idx_care_of_options_created_by` (`created_by`);

-- Drop the unique constraint on name (since different users can have same option names)
ALTER TABLE `care_of_options` DROP INDEX `name`;

-- Add a composite unique constraint: name must be unique per user (or per system-level)
-- This allows different users to have the same care-of option name
ALTER TABLE `care_of_options` 
ADD UNIQUE KEY `unique_name_per_user` (`name`, `created_by`);

-- Existing rows keep created_by = NULL (system-level, visible to all users)
-- No data deletion needed

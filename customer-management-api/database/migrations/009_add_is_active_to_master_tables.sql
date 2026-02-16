-- ========================================
-- Add is_active field to Master Data Tables
-- Migration: 009
-- For enabling/disabling master data instead of deleting
-- ========================================

USE customer_management_db;

-- Add is_active column to event_types
ALTER TABLE event_types 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER name;

-- Add is_active column to gift_types
ALTER TABLE gift_types 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER name;

-- Add is_active column to invitation_status
ALTER TABLE invitation_status 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER name;

-- Add is_active column to care_of_options
ALTER TABLE care_of_options 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER name;

-- Add indexes for better query performance
CREATE INDEX idx_event_types_active ON event_types(is_active);
CREATE INDEX idx_gift_types_active ON gift_types(is_active);
CREATE INDEX idx_invitation_status_active ON invitation_status(is_active);
CREATE INDEX idx_care_of_options_active ON care_of_options(is_active);

SELECT 'is_active field added to master data tables successfully!' AS status;

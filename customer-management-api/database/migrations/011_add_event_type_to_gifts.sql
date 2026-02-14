-- Migration: Add event_type_id to gifts table
-- Date: 2024
-- Description: Adds event type selection for gifts

-- Add event_type_id column to gifts table
ALTER TABLE gifts 
ADD COLUMN event_type_id INT NULL COMMENT 'FK to event_types table' AFTER gift_type_id;

-- Add foreign key constraint
ALTER TABLE gifts
ADD CONSTRAINT fk_gifts_event_type 
FOREIGN KEY (event_type_id) REFERENCES event_types(id);

-- Add index for event_type_id
CREATE INDEX idx_gift_event_type ON gifts(event_type_id);

SELECT 'Event type column added to gifts table successfully!' AS status;

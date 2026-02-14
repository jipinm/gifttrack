-- ========================================
-- Migration: Customer → Events → Gifts Relationship
-- Migration: 012
-- Description: Implements the new data model where:
--   - A Customer can have multiple Events
--   - Each Event can have one Gift
-- ========================================

USE customer_management_db;

-- ========================================
-- Step 1: Create customer_events table
-- ========================================
CREATE TABLE IF NOT EXISTS customer_events (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    customer_id VARCHAR(36) NOT NULL COMMENT 'FK to customers table',
    event_type_id INT NOT NULL COMMENT 'FK to event_types table',
    event_date DATE NOT NULL COMMENT 'Date of the event',
    invitation_status_id INT DEFAULT 2 COMMENT 'FK to invitation_status (Default: Not Called)',
    notes TEXT COMMENT 'Notes specific to this event',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id),
    FOREIGN KEY (invitation_status_id) REFERENCES invitation_status(id),
    
    INDEX idx_customer (customer_id),
    INDEX idx_event_type (event_type_id),
    INDEX idx_event_date (event_date),
    INDEX idx_invitation_status (invitation_status_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Step 2: Migrate existing customer events to customer_events table
-- ========================================
INSERT INTO customer_events (id, customer_id, event_type_id, event_date, invitation_status_id, notes, created_at)
SELECT 
    UUID() as id,
    c.id as customer_id,
    COALESCE(c.event_type_id, 1) as event_type_id,
    c.event_date,
    COALESCE(c.invitation_status_id, 2) as invitation_status_id,
    NULL as notes,
    c.created_at
FROM customers c
WHERE c.event_date IS NOT NULL;

-- ========================================
-- Step 3: Add event_id column to gifts table
-- ========================================
ALTER TABLE gifts 
ADD COLUMN event_id VARCHAR(36) NULL COMMENT 'FK to customer_events table' AFTER id;

-- ========================================
-- Step 4: Link existing gifts to their events
-- Match by customer_id and event_date
-- ========================================
UPDATE gifts g
INNER JOIN customer_events ce ON g.customer_id = ce.customer_id AND g.event_date = ce.event_date
SET g.event_id = ce.id;

-- For any gifts that couldn't be matched, create events for them
INSERT INTO customer_events (id, customer_id, event_type_id, event_date, invitation_status_id, created_at)
SELECT 
    UUID() as id,
    g.customer_id,
    COALESCE(g.event_type_id, 1) as event_type_id,
    g.event_date,
    2 as invitation_status_id,
    g.created_at
FROM gifts g
WHERE g.event_id IS NULL
GROUP BY g.customer_id, g.event_date, g.event_type_id, g.created_at;

-- Link remaining gifts to newly created events
UPDATE gifts g
INNER JOIN customer_events ce ON g.customer_id = ce.customer_id AND g.event_date = ce.event_date
SET g.event_id = ce.id
WHERE g.event_id IS NULL;

-- ========================================
-- Step 5: Add foreign key constraint and make event_id NOT NULL
-- ========================================
-- First, delete any orphaned gifts that couldn't be linked
DELETE FROM gifts WHERE event_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE gifts
MODIFY COLUMN event_id VARCHAR(36) NOT NULL COMMENT 'FK to customer_events table';

ALTER TABLE gifts
ADD CONSTRAINT fk_gifts_event 
FOREIGN KEY (event_id) REFERENCES customer_events(id) ON DELETE CASCADE;

-- Add index for event_id
CREATE INDEX idx_gift_event ON gifts(event_id);

-- ========================================
-- Step 6: Drop redundant columns from gifts table
-- ========================================
-- Remove customer_id (now accessed via event_id → customer_events)
-- Remove event_date (now stored in customer_events)
-- Remove event_type_id (now stored in customer_events)
ALTER TABLE gifts DROP FOREIGN KEY fk_gifts_event_type;
ALTER TABLE gifts DROP INDEX idx_gift_event_type;
ALTER TABLE gifts DROP COLUMN event_type_id;

ALTER TABLE gifts DROP INDEX idx_event_date;
ALTER TABLE gifts DROP COLUMN event_date;

-- Keep customer_id for now as a convenience link, but add a note that it's derived
-- ALTER TABLE gifts DROP FOREIGN KEY gifts_ibfk_1;
-- ALTER TABLE gifts DROP INDEX idx_customer;
-- ALTER TABLE gifts DROP COLUMN customer_id;

-- ========================================
-- Step 7: Update customers table - Keep event fields for backward compatibility
-- but they are now optional and represent the "primary" or "next" event
-- ========================================
-- We'll keep event_date and event_type_id in customers as nullable
-- They can represent the "next upcoming event" or be deprecated later

ALTER TABLE customers
MODIFY COLUMN event_date DATE NULL COMMENT 'Primary/next event date (deprecated - use customer_events)',
MODIFY COLUMN event_type_id INT NULL COMMENT 'Primary/next event type (deprecated - use customer_events)';

-- ========================================
-- Step 8: Create trigger to update customer gift_status based on events
-- ========================================
DROP TRIGGER IF EXISTS update_gift_status_after_gift_insert;
DROP TRIGGER IF EXISTS update_gift_status_after_gift_delete;

DELIMITER //

CREATE TRIGGER update_gift_status_after_gift_insert
AFTER INSERT ON gifts
FOR EACH ROW
BEGIN
    DECLARE customer_uuid VARCHAR(36);
    
    -- Get customer_id from the event
    SELECT customer_id INTO customer_uuid
    FROM customer_events
    WHERE id = NEW.event_id;
    
    -- Update customer gift_status to 'gifted'
    UPDATE customers 
    SET gift_status = 'gifted' 
    WHERE id = customer_uuid;
END //

CREATE TRIGGER update_gift_status_after_gift_delete
AFTER DELETE ON gifts
FOR EACH ROW
BEGIN
    DECLARE customer_uuid VARCHAR(36);
    DECLARE remaining_gifts INT;
    
    -- Get customer_id from the event
    SELECT customer_id INTO customer_uuid
    FROM customer_events
    WHERE id = OLD.event_id;
    
    -- Check if customer has any remaining gifts
    SELECT COUNT(*) INTO remaining_gifts
    FROM gifts g
    INNER JOIN customer_events ce ON g.event_id = ce.id
    WHERE ce.customer_id = customer_uuid;
    
    -- Update customer gift_status if no gifts remain
    IF remaining_gifts = 0 THEN
        UPDATE customers 
        SET gift_status = 'non-gifted' 
        WHERE id = customer_uuid;
    END IF;
END //

DELIMITER ;

-- ========================================
-- Step 9: Create view for easier querying
-- ========================================
CREATE OR REPLACE VIEW v_customer_events_with_gifts AS
SELECT 
    ce.id as event_id,
    ce.customer_id,
    c.name as customer_name,
    c.mobile_number as customer_mobile,
    ce.event_type_id,
    et.name as event_type_name,
    ce.event_date,
    ce.invitation_status_id,
    ist.name as invitation_status_name,
    ce.notes as event_notes,
    ce.created_at as event_created_at,
    g.id as gift_id,
    g.gift_type_id,
    gt.name as gift_type_name,
    g.value as gift_value,
    g.description as gift_description,
    CASE WHEN g.id IS NOT NULL THEN 'gifted' ELSE 'non-gifted' END as event_gift_status
FROM customer_events ce
INNER JOIN customers c ON ce.customer_id = c.id
LEFT JOIN event_types et ON ce.event_type_id = et.id
LEFT JOIN invitation_status ist ON ce.invitation_status_id = ist.id
LEFT JOIN gifts g ON g.event_id = ce.id
LEFT JOIN gift_types gt ON g.gift_type_id = gt.id;

SELECT 'Migration 012 completed: Customer → Events → Gifts relationship implemented!' AS status;

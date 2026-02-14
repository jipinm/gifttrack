-- ========================================
-- Migration: Move Invitation Status to Events
-- Migration: 013
-- Description: Removes invitation_status_id from customers table
--   as it is now managed at the event level in customer_events table
-- ========================================

USE customer_management_db;

-- ========================================
-- Step 1: Remove invitation_status_id foreign key and index from customers table
-- ========================================
ALTER TABLE customers DROP FOREIGN KEY customers_ibfk_6;
ALTER TABLE customers DROP INDEX idx_invitation_status;

-- ========================================
-- Step 2: Drop the invitation_status_id column from customers table
-- ========================================
ALTER TABLE customers DROP COLUMN invitation_status_id;

-- ========================================
-- Step 3: Update the view to reflect these changes
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

SELECT 'Migration 013 completed: Invitation status moved to events level!' AS status;

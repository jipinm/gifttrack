-- Migration: Add attendee_count to event_customers
-- Purpose: Track how many people attend per customer per event
-- Default: 1 (customer alone)

ALTER TABLE `event_customers`
    ADD COLUMN `attendee_count` INT NOT NULL DEFAULT 1
    AFTER `care_of_id`;

-- ============================================================================
-- Migration 014: Scope Change - Events Restructure
-- ============================================================================
-- This migration restructures the database to support the new scope:
-- 1. Events become standalone entities managed by Super Admin
-- 2. Event-Customer attachment via pivot table (event_customers)
-- 3. Event categories: Self Event / Customer Event
-- 4. Care Of field for Self Event attachments
-- 5. Gift direction derived from event category
-- 6. Customer table simplified (remove event/gift status fields)
-- 7. "Others" added to gift_types
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. Create care_of_options master table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `care_of_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `care_of_options` (`name`) VALUES
  ('Self'),
  ('Father'),
  ('Mother'),
  ('Brother'),
  ('Sister'),
  ('Son'),
  ('Daughter'),
  ('Others');

-- ============================================================================
-- 2. Add "Others" to gift_types if not exists
-- ============================================================================
INSERT IGNORE INTO `gift_types` (`name`) VALUES ('Others');

-- ============================================================================
-- 3. Create new standalone `events` table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `events` (
  `id` varchar(36) NOT NULL COMMENT 'UUID',
  `name` varchar(255) NOT NULL COMMENT 'Event name',
  `event_date` date NOT NULL COMMENT 'Date of the event',
  `event_type_id` int(11) NOT NULL COMMENT 'FK to event_types table',
  `event_category` enum('self_event','customer_event') NOT NULL DEFAULT 'self_event' COMMENT 'Self Event or Customer Event',
  `notes` text DEFAULT NULL COMMENT 'Event notes',
  `created_by` varchar(36) NOT NULL COMMENT 'Super Admin who created the event',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_event_type` (`event_type_id`),
  KEY `idx_event_category` (`event_category`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`event_type_id`) REFERENCES `event_types` (`id`),
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Create event_customers pivot table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `event_customers` (
  `id` varchar(36) NOT NULL COMMENT 'UUID',
  `event_id` varchar(36) NOT NULL COMMENT 'FK to events table',
  `customer_id` varchar(36) NOT NULL COMMENT 'FK to customers table',
  `invitation_status_id` int(11) DEFAULT 1 COMMENT 'FK to invitation_status (Default: Called)',
  `care_of_id` int(11) DEFAULT NULL COMMENT 'FK to care_of_options (Required for self_event)',
  `attached_by` varchar(36) NOT NULL COMMENT 'User who attached the customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_event_customer` (`event_id`, `customer_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_invitation_status` (`invitation_status_id`),
  KEY `idx_attached_by` (`attached_by`),
  CONSTRAINT `event_customers_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_customers_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_customers_ibfk_3` FOREIGN KEY (`invitation_status_id`) REFERENCES `invitation_status` (`id`),
  CONSTRAINT `event_customers_ibfk_4` FOREIGN KEY (`care_of_id`) REFERENCES `care_of_options` (`id`),
  CONSTRAINT `event_customers_ibfk_5` FOREIGN KEY (`attached_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Migrate existing data from customer_events to new structure
-- ============================================================================

-- 5a. Create events from existing customer_events
-- Each customer_event becomes a standalone event (named after customer + event type)
INSERT INTO `events` (`id`, `name`, `event_date`, `event_type_id`, `event_category`, `notes`, `created_by`, `created_at`, `updated_at`)
SELECT 
  ce.id,
  CONCAT(c.name, ' - ', COALESCE(et.name, 'Event')),
  ce.event_date,
  ce.event_type_id,
  'customer_event',
  ce.notes,
  COALESCE(c.created_by, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)),
  ce.created_at,
  ce.updated_at
FROM customer_events ce
INNER JOIN customers c ON ce.customer_id = c.id
LEFT JOIN event_types et ON ce.event_type_id = et.id;

-- 5b. Create event_customers entries from existing customer_events
INSERT INTO `event_customers` (`id`, `event_id`, `customer_id`, `invitation_status_id`, `care_of_id`, `attached_by`, `created_at`, `updated_at`)
SELECT 
  UUID(),
  ce.id,
  ce.customer_id,
  ce.invitation_status_id,
  NULL,
  COALESCE(c.created_by, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)),
  ce.created_at,
  ce.updated_at
FROM customer_events ce
INNER JOIN customers c ON ce.customer_id = c.id;

-- ============================================================================
-- 6. Update gifts table - change FK from customer_events to events
-- ============================================================================

-- Drop old triggers first (they reference old structure)
DROP TRIGGER IF EXISTS `update_gift_status_after_insert`;
DROP TRIGGER IF EXISTS `update_gift_status_after_delete`;
DROP TRIGGER IF EXISTS `update_gift_status_after_gift_insert`;
DROP TRIGGER IF EXISTS `update_gift_status_after_gift_delete`;

-- Drop old FK constraint on gifts.event_id
ALTER TABLE `gifts` DROP FOREIGN KEY `fk_gifts_event`;

-- Add new FK constraint pointing to events table
ALTER TABLE `gifts` ADD CONSTRAINT `fk_gifts_event_new` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

-- ============================================================================
-- 7. Drop old view and customer_events table
-- ============================================================================
DROP VIEW IF EXISTS `v_customer_events_with_gifts`;
DROP TABLE IF EXISTS `customer_events`;

-- ============================================================================
-- 8. Modify customers table - remove deprecated columns
-- ============================================================================

-- Drop FK for event_type_id on customers if exists
-- (The column may have FK or just be a regular column)
ALTER TABLE `customers` DROP COLUMN IF EXISTS `event_type_id`;
ALTER TABLE `customers` DROP COLUMN IF EXISTS `event_date`;
ALTER TABLE `customers` DROP COLUMN IF EXISTS `gift_status`;

-- Drop indexes that referenced removed columns
-- (Using IF EXISTS syntax not supported in MariaDB for indexes, so we use a safe approach)

-- ============================================================================
-- 9. Create new view for events with customers and gifts
-- ============================================================================
CREATE VIEW `v_events_with_customers_gifts` AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.event_date,
  e.event_type_id,
  et.name as event_type_name,
  e.event_category,
  e.notes as event_notes,
  e.created_by as event_created_by,
  e.created_at as event_created_at,
  ec.id as attachment_id,
  ec.customer_id,
  c.name as customer_name,
  c.mobile_number as customer_mobile,
  ec.invitation_status_id,
  ist.name as invitation_status_name,
  ec.care_of_id,
  co.name as care_of_name,
  ec.attached_by,
  g.id as gift_id,
  g.gift_type_id,
  gt.name as gift_type_name,
  g.value as gift_value,
  g.description as gift_description,
  CASE 
    WHEN e.event_category = 'self_event' THEN 'received'
    WHEN e.event_category = 'customer_event' THEN 'given'
  END as gift_direction
FROM events e
LEFT JOIN event_types et ON e.event_type_id = et.id
LEFT JOIN event_customers ec ON ec.event_id = e.id
LEFT JOIN customers c ON ec.customer_id = c.id
LEFT JOIN invitation_status ist ON ec.invitation_status_id = ist.id
LEFT JOIN care_of_options co ON ec.care_of_id = co.id
LEFT JOIN gifts g ON g.event_id = e.id AND g.customer_id = ec.customer_id
LEFT JOIN gift_types gt ON g.gift_type_id = gt.id;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- New structure:
-- events (standalone, Super Admin managed)
--   └── event_customers (pivot, many-to-many)
--         └── gifts (per event + customer)
-- customers (simplified, no event/gift status fields)
-- care_of_options (master data)
-- ============================================================================

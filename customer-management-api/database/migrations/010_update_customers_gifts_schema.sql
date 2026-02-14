-- ========================================
-- Update Customers and Gifts Tables
-- Migration: 010
-- Add foreign keys to master data tables
-- ========================================

USE customer_management_db;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_gift_status_after_insert;
DROP TRIGGER IF EXISTS update_gift_status_after_delete;

-- Drop gifts table first (has FK to customers)
DROP TABLE IF EXISTS gifts;

-- Backup existing data (optional, for safety)
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- Drop existing customers table to recreate with new structure
DROP TABLE IF EXISTS customers;

-- Recreate customers table with master data references
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    district_id INT NOT NULL COMMENT 'FK to districts table',
    city_id INT NOT NULL COMMENT 'FK to cities table',
    state_id INT NOT NULL COMMENT 'FK to states table',
    event_type_id INT COMMENT 'FK to event_types table',
    event_date DATE NOT NULL,
    invitation_status_id INT DEFAULT 2 COMMENT 'FK to invitation_status (Default: Not Called)',
    gift_status ENUM('gifted', 'non-gifted') NOT NULL DEFAULT 'non-gifted',
    notes TEXT COMMENT 'Additional notes about customer',
    created_by VARCHAR(36) COMMENT 'Admin user ID who created this customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (state_id) REFERENCES states(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (event_type_id) REFERENCES event_types(id),
    FOREIGN KEY (invitation_status_id) REFERENCES invitation_status(id),
    
    INDEX idx_mobile (mobile_number),
    INDEX idx_event_date (event_date),
    INDEX idx_gift_status (gift_status),
    INDEX idx_district (district_id),
    INDEX idx_city (city_id),
    INDEX idx_event_type (event_type_id),
    INDEX idx_invitation_status (invitation_status_id),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop and recreate gifts table with master data reference
-- (Already dropped above)
CREATE TABLE gifts (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    customer_id VARCHAR(36) NOT NULL,
    event_date DATE NOT NULL COMMENT 'Date when gift was given',
    gift_type_id INT NOT NULL COMMENT 'FK to gift_types table',
    value DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gift value in currency',
    description TEXT COMMENT 'Gift description/details',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (gift_type_id) REFERENCES gift_types(id),
    
    INDEX idx_customer (customer_id),
    INDEX idx_event_date (event_date),
    INDEX idx_gift_type (gift_type_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Customers and Gifts tables updated successfully!' AS status;

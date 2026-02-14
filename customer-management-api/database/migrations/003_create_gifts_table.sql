-- ========================================
-- Gifts Table
-- Migration: 003
-- ========================================

USE customer_management_db;

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS gifts;

-- Create gifts table
CREATE TABLE gifts (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    customer_id VARCHAR(36) NOT NULL,
    event_date DATE NOT NULL COMMENT 'Date when gift was given',
    type ENUM('Cash', 'Voucher', 'Physical Gift', 'Others') NOT NULL,
    value DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gift value in currency',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    INDEX idx_customer (customer_id),
    INDEX idx_event_date (event_date),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display success message
SELECT 'Gifts table created successfully!' AS status;

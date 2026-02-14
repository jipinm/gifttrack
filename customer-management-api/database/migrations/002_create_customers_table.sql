-- ========================================
-- Customers Table
-- Migration: 002
-- ========================================

USE customer_management_db;

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS customers;

-- Create customers table
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Kerala',
    event_date DATE NOT NULL,
    gift_status ENUM('gifted', 'non-gifted') NOT NULL DEFAULT 'non-gifted',
    created_by VARCHAR(36) COMMENT 'Admin user ID who created this customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_mobile (mobile_number),
    INDEX idx_event_date (event_date),
    INDEX idx_gift_status (gift_status),
    INDEX idx_district (district),
    INDEX idx_city (city),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display success message
SELECT 'Customers table created successfully!' AS status;

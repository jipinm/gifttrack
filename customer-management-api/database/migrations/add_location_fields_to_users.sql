-- Migration: Add location fields (state_id, district_id, city_id) to users table
-- Date: 2026-02-06
-- Description: Replace 'place' text field with foreign key references to states, districts, cities tables
-- Status: ALREADY APPLIED

-- Add new columns (idempotent - only if not exists)
-- MySQL doesn't support IF NOT EXISTS for columns, so we use stored procedure
DELIMITER //
DROP PROCEDURE IF EXISTS add_location_columns//
CREATE PROCEDURE add_location_columns()
BEGIN
    -- Add state_id if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'state_id') THEN
        ALTER TABLE users ADD COLUMN state_id INT NULL AFTER address;
        ALTER TABLE users ADD INDEX idx_users_state_id (state_id);
    END IF;
    
    -- Add district_id if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'district_id') THEN
        ALTER TABLE users ADD COLUMN district_id INT NULL AFTER state_id;
        ALTER TABLE users ADD INDEX idx_users_district_id (district_id);
    END IF;
    
    -- Add city_id if not exists
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'city_id') THEN
        ALTER TABLE users ADD COLUMN city_id INT NULL AFTER district_id;
        ALTER TABLE users ADD INDEX idx_users_city_id (city_id);
    END IF;
END//
DELIMITER ;

CALL add_location_columns();
DROP PROCEDURE IF EXISTS add_location_columns;

-- Add foreign key constraints (optional - uncomment if you want referential integrity)
-- ALTER TABLE users
-- ADD CONSTRAINT fk_users_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_users_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_users_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;

-- Note: The 'place' column is kept for backward compatibility
-- You can optionally remove it after migrating existing data:
-- ALTER TABLE users DROP COLUMN place;

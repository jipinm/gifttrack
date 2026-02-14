-- ========================================
-- Trigger: Auto-update customer gift_status
-- When a gift is added/deleted
-- ========================================

USE customer_management_db;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_gift_status_after_insert;
DROP TRIGGER IF EXISTS update_gift_status_after_delete;

-- Trigger: After inserting a gift, set customer gift_status to 'gifted'
DELIMITER $$
CREATE TRIGGER update_gift_status_after_insert
AFTER INSERT ON gifts
FOR EACH ROW
BEGIN
    UPDATE customers 
    SET gift_status = 'gifted'
    WHERE id = NEW.customer_id;
END$$
DELIMITER ;

-- Trigger: After deleting a gift, check if customer still has gifts
DELIMITER $$
CREATE TRIGGER update_gift_status_after_delete
AFTER DELETE ON gifts
FOR EACH ROW
BEGIN
    DECLARE gift_count INT;
    
    SELECT COUNT(*) INTO gift_count
    FROM gifts
    WHERE customer_id = OLD.customer_id;
    
    IF gift_count = 0 THEN
        UPDATE customers 
        SET gift_status = 'non-gifted'
        WHERE id = OLD.customer_id;
    END IF;
END$$
DELIMITER ;

-- Display success message
SELECT 'Database triggers created successfully!' AS status;

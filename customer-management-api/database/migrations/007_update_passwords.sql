-- Update user passwords with correct hash for "Admin@123"
USE customer_management_db;

UPDATE users 
SET password = '$2y$10$/.W7K/SGDQPWoTVjIu2B5e9G1VGTkpwPQD6GTeqorKRlHwyAqQ.Ky'
WHERE mobile_number IN ('9999999999', '8888888888');

-- Verify update
SELECT id, mobile_number, LEFT(password, 30) as password_hash FROM users;

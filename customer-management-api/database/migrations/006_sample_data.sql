-- ========================================
-- Sample Test Data (Optional)
-- For development and testing purposes
-- ========================================

USE customer_management_db;

-- Insert sample customers
INSERT INTO customers (
    id,
    name,
    mobile_number,
    address,
    district,
    city,
    state,
    event_date,
    gift_status,
    created_by,
    created_at
) VALUES 
(
    UUID(),
    'John Doe',
    '9876543210',
    '123, MG Road, Ernakulam',
    'Ernakulam',
    'Kochi',
    'Kerala',
    '2026-03-15',
    'non-gifted',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW()
),
(
    UUID(),
    'Jane Smith',
    '9876543211',
    '456, Marine Drive, Ernakulam',
    'Ernakulam',
    'Kochi',
    'Kerala',
    '2026-04-20',
    'non-gifted',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW()
),
(
    UUID(),
    'Rajesh Kumar',
    '9876543212',
    '789, Broadway, Ernakulam',
    'Ernakulam',
    'Aluva',
    'Kerala',
    '2026-05-10',
    'non-gifted',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW()
);

-- Get customer IDs for gift insertion
SET @customer1_id = (SELECT id FROM customers WHERE mobile_number = '9876543210');
SET @customer2_id = (SELECT id FROM customers WHERE mobile_number = '9876543211');

-- Insert sample gifts
INSERT INTO gifts (
    id,
    customer_id,
    event_date,
    type,
    value,
    created_at
) VALUES 
(
    UUID(),
    @customer1_id,
    '2026-03-15',
    'Cash',
    5000.00,
    NOW()
),
(
    UUID(),
    @customer1_id,
    '2026-03-15',
    'Voucher',
    2000.00,
    NOW()
),
(
    UUID(),
    @customer2_id,
    '2026-04-20',
    'Physical Gift',
    3500.00,
    NOW()
);

-- Display inserted data
SELECT 'Sample customers inserted:' AS info;
SELECT 
    id,
    name,
    mobile_number,
    district,
    city,
    event_date,
    gift_status
FROM customers;

SELECT '' AS separator;
SELECT 'Sample gifts inserted:' AS info;
SELECT 
    g.id,
    c.name AS customer_name,
    g.event_date,
    g.type,
    g.value
FROM gifts g
JOIN customers c ON g.customer_id = c.id;

SELECT 'Sample test data inserted successfully!' AS status;

-- ========================================
-- Seed Data: Default Super Admin User
-- Migration: 005
-- ========================================

USE customer_management_db;

-- Generate UUID function for MySQL (if not available)
-- Note: MySQL 8.0+ has UUID() function, for older versions use this approach

-- Insert default super admin
-- Password: Admin@123 (hashed using PHP password_hash with bcrypt)
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (
    id,
    name,
    mobile_number,
    password,
    address,
    place,
    branch,
    role,
    created_at
) VALUES (
    UUID(),
    'Super Admin',
    '9999999999',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Head Office, Main Street',
    'Kochi',
    'Headquarters',
    'superadmin',
    NOW()
);

-- Insert sample admin user
INSERT INTO users (
    id,
    name,
    mobile_number,
    password,
    address,
    place,
    branch,
    role,
    created_at
) VALUES (
    UUID(),
    'Admin User',
    '8888888888',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Branch Office, MG Road',
    'Ernakulam',
    'Kochi Branch',
    'admin',
    NOW()
);

-- Display created users
SELECT 
    id,
    name,
    mobile_number,
    role,
    created_at
FROM users
ORDER BY role DESC;

-- Display success message
SELECT 'Seed data inserted successfully!' AS status;
SELECT 'Login credentials:' AS info;
SELECT 'Super Admin - Mobile: 9999999999, Password: Admin@123' AS credentials;
SELECT 'Admin User - Mobile: 8888888888, Password: Admin@123' AS credentials;

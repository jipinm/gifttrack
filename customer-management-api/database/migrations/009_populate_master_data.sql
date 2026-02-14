-- ========================================
-- Populate Master Data
-- Migration: 009
-- Kerala State, Districts, Cities, Event Types, etc.
-- ========================================

USE customer_management_db;

-- Insert State (Kerala)
INSERT INTO states (name, code) VALUES ('Kerala', 'KL');

-- Get Kerala state ID
SET @kerala_id = LAST_INSERT_ID();

-- Insert 14 Districts of Kerala
INSERT INTO districts (state_id, name) VALUES
(@kerala_id, 'Thiruvananthapuram'),
(@kerala_id, 'Kollam'),
(@kerala_id, 'Pathanamthitta'),
(@kerala_id, 'Alappuzha'),
(@kerala_id, 'Kottayam'),
(@kerala_id, 'Idukki'),
(@kerala_id, 'Ernakulam'),
(@kerala_id, 'Thrissur'),
(@kerala_id, 'Palakkad'),
(@kerala_id, 'Malappuram'),
(@kerala_id, 'Kozhikode'),
(@kerala_id, 'Wayanad'),
(@kerala_id, 'Kannur'),
(@kerala_id, 'Kasaragod');

-- Insert Cities for Thiruvananthapuram District
SET @district_id = (SELECT id FROM districts WHERE name = 'Thiruvananthapuram');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Thiruvananthapuram'),
(@district_id, 'Neyyattinkara'),
(@district_id, 'Attingal'),
(@district_id, 'Varkala'),
(@district_id, 'Nedumangad'),
(@district_id, 'Kazhakootam'),
(@district_id, 'Kovalam');

-- Insert Cities for Kollam District
SET @district_id = (SELECT id FROM districts WHERE name = 'Kollam');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kollam'),
(@district_id, 'Karunagappally'),
(@district_id, 'Punalur'),
(@district_id, 'Paravur'),
(@district_id, 'Kottarakkara'),
(@district_id, 'Chavara');

-- Insert Cities for Pathanamthitta District
SET @district_id = (SELECT id FROM districts WHERE name = 'Pathanamthitta');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Pathanamthitta'),
(@district_id, 'Adoor'),
(@district_id, 'Thiruvalla'),
(@district_id, 'Ranni'),
(@district_id, 'Konni'),
(@district_id, 'Pandalam');

-- Insert Cities for Alappuzha District
SET @district_id = (SELECT id FROM districts WHERE name = 'Alappuzha');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Alappuzha'),
(@district_id, 'Cherthala'),
(@district_id, 'Kayamkulam'),
(@district_id, 'Haripad'),
(@district_id, 'Mavelikkara'),
(@district_id, 'Chengannur');

-- Insert Cities for Kottayam District
SET @district_id = (SELECT id FROM districts WHERE name = 'Kottayam');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kottayam'),
(@district_id, 'Pala'),
(@district_id, 'Changanassery'),
(@district_id, 'Ettumanoor'),
(@district_id, 'Vaikom'),
(@district_id, 'Erattupetta');

-- Insert Cities for Idukki District
SET @district_id = (SELECT id FROM districts WHERE name = 'Idukki');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Thodupuzha'),
(@district_id, 'Munnar'),
(@district_id, 'Kattappana'),
(@district_id, 'Adimaly'),
(@district_id, 'Nedumkandam'),
(@district_id, 'Kumily');

-- Insert Cities for Ernakulam District
SET @district_id = (SELECT id FROM districts WHERE name = 'Ernakulam');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kochi'),
(@district_id, 'Aluva'),
(@district_id, 'Perumbavoor'),
(@district_id, 'Kothamangalam'),
(@district_id, 'Muvattupuzha'),
(@district_id, 'Angamaly'),
(@district_id, 'Kalamassery'),
(@district_id, 'Thrikkakara'),
(@district_id, 'Vypeen'),
(@district_id, 'North Paravur');

-- Insert Cities for Thrissur District
SET @district_id = (SELECT id FROM districts WHERE name = 'Thrissur');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Thrissur'),
(@district_id, 'Chalakudy'),
(@district_id, 'Kodungallur'),
(@district_id, 'Irinjalakuda'),
(@district_id, 'Wadakkanchery'),
(@district_id, 'Guruvayur'),
(@district_id, 'Kunnamkulam');

-- Insert Cities for Palakkad District
SET @district_id = (SELECT id FROM districts WHERE name = 'Palakkad');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Palakkad'),
(@district_id, 'Ottapalam'),
(@district_id, 'Shoranur'),
(@district_id, 'Mannarkkad'),
(@district_id, 'Cherpulassery'),
(@district_id, 'Chittur');

-- Insert Cities for Malappuram District
SET @district_id = (SELECT id FROM districts WHERE name = 'Malappuram');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Malappuram'),
(@district_id, 'Manjeri'),
(@district_id, 'Tirur'),
(@district_id, 'Perinthalmanna'),
(@district_id, 'Ponnani'),
(@district_id, 'Nilambur'),
(@district_id, 'Kondotty');

-- Insert Cities for Kozhikode District
SET @district_id = (SELECT id FROM districts WHERE name = 'Kozhikode');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kozhikode'),
(@district_id, 'Vadakara'),
(@district_id, 'Koyilandy'),
(@district_id, 'Thamarassery'),
(@district_id, 'Feroke'),
(@district_id, 'Ramanattukara');

-- Insert Cities for Wayanad District
SET @district_id = (SELECT id FROM districts WHERE name = 'Wayanad');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kalpetta'),
(@district_id, 'Sulthan Bathery'),
(@district_id, 'Mananthavady'),
(@district_id, 'Vythiri');

-- Insert Cities for Kannur District
SET @district_id = (SELECT id FROM districts WHERE name = 'Kannur');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kannur'),
(@district_id, 'Thalassery'),
(@district_id, 'Payyanur'),
(@district_id, 'Mattannur'),
(@district_id, 'Taliparamba'),
(@district_id, 'Iritty');

-- Insert Cities for Kasaragod District
SET @district_id = (SELECT id FROM districts WHERE name = 'Kasaragod');
INSERT INTO cities (district_id, name) VALUES
(@district_id, 'Kasaragod'),
(@district_id, 'Kanhangad'),
(@district_id, 'Nileshwar'),
(@district_id, 'Uppala'),
(@district_id, 'Manjeshwar');

-- Insert Event Types
INSERT INTO event_types (name) VALUES
('Reception'),
('Wedding'),
('Engagement'),
('Birthday'),
('Anniversary'),
('House Warming'),
('Others');

-- Insert Invitation Status
INSERT INTO invitation_status (name) VALUES
('Called'),
('Not Called');

-- Insert Gift Types
INSERT INTO gift_types (name) VALUES
('Cash'),
('Physical Gift'),
('Voucher');

-- Display summary
SELECT 'Master data populated successfully!' AS status;
SELECT COUNT(*) as total_districts FROM districts;
SELECT COUNT(*) as total_cities FROM cities;
SELECT COUNT(*) as total_event_types FROM event_types;

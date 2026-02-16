-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.13.0.7147
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table customer_management_db.care_of_options
CREATE TABLE IF NOT EXISTS `care_of_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_care_of_options_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.care_of_options: ~8 rows (approximately)
INSERT INTO `care_of_options` (`id`, `name`, `is_active`, `is_default`, `created_at`) VALUES
	(1, 'Self', 1, 1, '2026-02-14 07:44:11'),
	(2, 'Father', 1, 0, '2026-02-14 07:44:11'),
	(3, 'Mother', 1, 0, '2026-02-14 07:44:11'),
	(4, 'Brother', 1, 0, '2026-02-14 07:44:11'),
	(5, 'Sister', 1, 0, '2026-02-14 07:44:11'),
	(6, 'Son', 1, 0, '2026-02-14 07:44:11'),
	(7, 'Daughter', 1, 0, '2026-02-14 07:44:11'),
	(8, 'Others', 1, 0, '2026-02-14 07:44:11'),
	(9, 'Friend', 1, 0, '2026-02-15 07:12:53');

-- Dumping structure for table customer_management_db.cities
CREATE TABLE IF NOT EXISTS `cities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `district_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_district` (`district_id`),
  CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.cities: ~88 rows (approximately)
INSERT INTO `cities` (`id`, `district_id`, `name`, `created_at`) VALUES
	(1, 1, 'Thiruvananthapuram', '2026-02-04 11:58:06'),
	(2, 1, 'Neyyattinkara', '2026-02-04 11:58:06'),
	(3, 1, 'Attingal', '2026-02-04 11:58:06'),
	(4, 1, 'Varkala', '2026-02-04 11:58:06'),
	(5, 1, 'Nedumangad', '2026-02-04 11:58:06'),
	(6, 1, 'Kazhakootam', '2026-02-04 11:58:06'),
	(7, 1, 'Kovalam', '2026-02-04 11:58:06'),
	(8, 2, 'Kollam', '2026-02-04 11:58:06'),
	(9, 2, 'Karunagappally', '2026-02-04 11:58:06'),
	(10, 2, 'Punalur', '2026-02-04 11:58:06'),
	(11, 2, 'Paravur', '2026-02-04 11:58:06'),
	(12, 2, 'Kottarakkara', '2026-02-04 11:58:06'),
	(13, 2, 'Chavara', '2026-02-04 11:58:06'),
	(14, 3, 'Pathanamthitta', '2026-02-04 11:58:06'),
	(15, 3, 'Adoor', '2026-02-04 11:58:06'),
	(16, 3, 'Thiruvalla', '2026-02-04 11:58:06'),
	(17, 3, 'Ranni', '2026-02-04 11:58:06'),
	(18, 3, 'Konni', '2026-02-04 11:58:06'),
	(19, 3, 'Pandalam', '2026-02-04 11:58:06'),
	(20, 4, 'Alappuzha', '2026-02-04 11:58:06'),
	(21, 4, 'Cherthala', '2026-02-04 11:58:06'),
	(22, 4, 'Kayamkulam', '2026-02-04 11:58:06'),
	(23, 4, 'Haripad', '2026-02-04 11:58:06'),
	(24, 4, 'Mavelikkara', '2026-02-04 11:58:06'),
	(25, 4, 'Chengannur', '2026-02-04 11:58:06'),
	(26, 5, 'Kottayam', '2026-02-04 11:58:06'),
	(27, 5, 'Pala', '2026-02-04 11:58:06'),
	(28, 5, 'Changanassery', '2026-02-04 11:58:06'),
	(29, 5, 'Ettumanoor', '2026-02-04 11:58:06'),
	(30, 5, 'Vaikom', '2026-02-04 11:58:06'),
	(31, 5, 'Erattupetta', '2026-02-04 11:58:06'),
	(32, 6, 'Thodupuzha', '2026-02-04 11:58:06'),
	(33, 6, 'Munnar', '2026-02-04 11:58:06'),
	(34, 6, 'Kattappana', '2026-02-04 11:58:06'),
	(35, 6, 'Adimaly', '2026-02-04 11:58:06'),
	(36, 6, 'Nedumkandam', '2026-02-04 11:58:06'),
	(37, 6, 'Kumily', '2026-02-04 11:58:06'),
	(38, 7, 'Kochi', '2026-02-04 11:58:06'),
	(39, 7, 'Aluva', '2026-02-04 11:58:06'),
	(40, 7, 'Perumbavoor', '2026-02-04 11:58:06'),
	(41, 7, 'Kothamangalam', '2026-02-04 11:58:06'),
	(42, 7, 'Muvattupuzha', '2026-02-04 11:58:06'),
	(43, 7, 'Angamaly', '2026-02-04 11:58:06'),
	(44, 7, 'Kalamassery', '2026-02-04 11:58:06'),
	(45, 7, 'Thrikkakara', '2026-02-04 11:58:06'),
	(46, 7, 'Vypeen', '2026-02-04 11:58:06'),
	(47, 7, 'North Paravur', '2026-02-04 11:58:06'),
	(48, 8, 'Thrissur', '2026-02-04 11:58:06'),
	(49, 8, 'Chalakudy', '2026-02-04 11:58:06'),
	(50, 8, 'Kodungallur', '2026-02-04 11:58:06'),
	(51, 8, 'Irinjalakuda', '2026-02-04 11:58:06'),
	(52, 8, 'Wadakkanchery', '2026-02-04 11:58:06'),
	(53, 8, 'Guruvayur', '2026-02-04 11:58:06'),
	(54, 8, 'Kunnamkulam', '2026-02-04 11:58:06'),
	(55, 9, 'Palakkad', '2026-02-04 11:58:06'),
	(56, 9, 'Ottapalam', '2026-02-04 11:58:06'),
	(57, 9, 'Shoranur', '2026-02-04 11:58:06'),
	(58, 9, 'Mannarkkad', '2026-02-04 11:58:06'),
	(59, 9, 'Cherpulassery', '2026-02-04 11:58:06'),
	(60, 9, 'Chittur', '2026-02-04 11:58:06'),
	(61, 10, 'Malappuram', '2026-02-04 11:58:06'),
	(62, 10, 'Manjeri', '2026-02-04 11:58:06'),
	(63, 10, 'Tirur', '2026-02-04 11:58:06'),
	(64, 10, 'Perinthalmanna', '2026-02-04 11:58:06'),
	(65, 10, 'Ponnani', '2026-02-04 11:58:06'),
	(66, 10, 'Nilambur', '2026-02-04 11:58:06'),
	(67, 10, 'Kondotty', '2026-02-04 11:58:06'),
	(68, 11, 'Kozhikode', '2026-02-04 11:58:06'),
	(69, 11, 'Vadakara', '2026-02-04 11:58:06'),
	(70, 11, 'Koyilandy', '2026-02-04 11:58:06'),
	(71, 11, 'Thamarassery', '2026-02-04 11:58:06'),
	(72, 11, 'Feroke', '2026-02-04 11:58:06'),
	(73, 11, 'Ramanattukara', '2026-02-04 11:58:06'),
	(74, 12, 'Kalpetta', '2026-02-04 11:58:06'),
	(75, 12, 'Sulthan Bathery', '2026-02-04 11:58:06'),
	(76, 12, 'Mananthavady', '2026-02-04 11:58:06'),
	(77, 12, 'Vythiri', '2026-02-04 11:58:06'),
	(78, 13, 'Kannur', '2026-02-04 11:58:06'),
	(79, 13, 'Thalassery', '2026-02-04 11:58:06'),
	(80, 13, 'Payyanur', '2026-02-04 11:58:06'),
	(81, 13, 'Mattannur', '2026-02-04 11:58:06'),
	(82, 13, 'Taliparamba', '2026-02-04 11:58:06'),
	(83, 13, 'Iritty', '2026-02-04 11:58:06'),
	(84, 14, 'Kasaragod', '2026-02-04 11:58:06'),
	(85, 14, 'Kanhangad', '2026-02-04 11:58:06'),
	(86, 14, 'Nileshwar', '2026-02-04 11:58:06'),
	(87, 14, 'Uppala', '2026-02-04 11:58:06'),
	(88, 14, 'Manjeshwar', '2026-02-04 11:58:06');

-- Dumping structure for table customer_management_db.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(36) NOT NULL COMMENT 'UUID',
  `name` varchar(255) NOT NULL,
  `mobile_number` varchar(10) NOT NULL,
  `address` text NOT NULL,
  `district_id` int(11) NOT NULL COMMENT 'FK to districts table',
  `city_id` int(11) NOT NULL COMMENT 'FK to cities table',
  `state_id` int(11) NOT NULL COMMENT 'FK to states table',
  `notes` text DEFAULT NULL COMMENT 'Additional notes about customer',
  `created_by` varchar(36) DEFAULT NULL COMMENT 'Admin user ID who created this customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `state_id` (`state_id`),
  KEY `idx_mobile` (`mobile_number`),
  KEY `idx_district` (`district_id`),
  KEY `idx_city` (`city_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`),
  CONSTRAINT `customers_ibfk_3` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`),
  CONSTRAINT `customers_ibfk_4` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.customers: ~2 rows (approximately)
INSERT INTO `customers` (`id`, `name`, `mobile_number`, `address`, `district_id`, `city_id`, `state_id`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
	('2fd8ccbf-0ab1-11f1-830b-7008945b491c', 'Jinu abraham', '5582225824', 'Jinu villa', 13, 82, 1, NULL, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-15 20:59:15', '2026-02-15 20:59:15'),
	('4a36d642-0ab1-11f1-830b-7008945b491c', 'Sheelu shan', '5584447542', 'Sheelu shan villa', 6, 35, 1, NULL, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-15 20:59:59', '2026-02-15 20:59:59'),
	('98563f49-0b0b-11f1-830b-7008945b491c', 'Test customer', '4417774152', 'Test cust address', 14, 86, 1, NULL, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-16 07:46:22', '2026-02-16 07:46:22');

-- Dumping structure for table customer_management_db.districts
CREATE TABLE IF NOT EXISTS `districts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_state` (`state_id`),
  CONSTRAINT `districts_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.districts: ~14 rows (approximately)
INSERT INTO `districts` (`id`, `state_id`, `name`, `created_at`) VALUES
	(1, 1, 'Thiruvananthapuram', '2026-02-04 11:58:06'),
	(2, 1, 'Kollam', '2026-02-04 11:58:06'),
	(3, 1, 'Pathanamthitta', '2026-02-04 11:58:06'),
	(4, 1, 'Alappuzha', '2026-02-04 11:58:06'),
	(5, 1, 'Kottayam', '2026-02-04 11:58:06'),
	(6, 1, 'Idukki', '2026-02-04 11:58:06'),
	(7, 1, 'Ernakulam', '2026-02-04 11:58:06'),
	(8, 1, 'Thrissur', '2026-02-04 11:58:06'),
	(9, 1, 'Palakkad', '2026-02-04 11:58:06'),
	(10, 1, 'Malappuram', '2026-02-04 11:58:06'),
	(11, 1, 'Kozhikode', '2026-02-04 11:58:06'),
	(12, 1, 'Wayanad', '2026-02-04 11:58:06'),
	(13, 1, 'Kannur', '2026-02-04 11:58:06'),
	(14, 1, 'Kasaragod', '2026-02-04 11:58:06');

-- Dumping structure for table customer_management_db.event_customers
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
  UNIQUE KEY `idx_event_customer` (`event_id`,`customer_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_invitation_status` (`invitation_status_id`),
  KEY `idx_attached_by` (`attached_by`),
  KEY `event_customers_ibfk_4` (`care_of_id`),
  CONSTRAINT `event_customers_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_customers_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_customers_ibfk_3` FOREIGN KEY (`invitation_status_id`) REFERENCES `invitation_status` (`id`),
  CONSTRAINT `event_customers_ibfk_4` FOREIGN KEY (`care_of_id`) REFERENCES `care_of_options` (`id`),
  CONSTRAINT `event_customers_ibfk_5` FOREIGN KEY (`attached_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.event_customers: ~4 rows (approximately)
INSERT INTO `event_customers` (`id`, `event_id`, `customer_id`, `invitation_status_id`, `care_of_id`, `attached_by`, `created_at`, `updated_at`) VALUES
	('4765690a-dc4a-79eb-fbcc-40b40d0367cb', '5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', '2fd8ccbf-0ab1-11f1-830b-7008945b491c', 1, 1, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-16 05:42:58', '2026-02-16 05:42:58'),
	('5ea53156-5a0d-5847-95a1-38559f13439e', '5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', '98563f49-0b0b-11f1-830b-7008945b491c', 2, 1, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-16 07:46:48', '2026-02-16 07:46:48'),
	('963c7a72-798d-a947-b5dc-87cc63ab7a24', '5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', '4a36d642-0ab1-11f1-830b-7008945b491c', 2, 1, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-16 05:41:49', '2026-02-16 05:41:49'),
	('a80cf4f1-ae9d-fce1-9d98-3ace8c500a07', '1efcb3e0-1f36-bcea-9acc-197eda45807f', '2fd8ccbf-0ab1-11f1-830b-7008945b491c', 2, NULL, '23176fe7-0a50-11f1-b752-7008945b491c', '2026-02-16 05:39:07', '2026-02-16 05:39:07');

-- Dumping structure for table customer_management_db.event_types
CREATE TABLE IF NOT EXISTS `event_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_event_types_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.event_types: ~7 rows (approximately)
INSERT INTO `event_types` (`id`, `name`, `is_active`, `is_default`, `created_at`) VALUES
	(1, 'Reception', 1, 0, '2026-02-04 11:58:06'),
	(2, 'Wedding', 1, 1, '2026-02-04 11:58:06'),
	(3, 'Engagement', 1, 0, '2026-02-04 11:58:06'),
	(4, 'Birthday', 1, 0, '2026-02-04 11:58:06'),
	(5, 'Anniversary', 1, 0, '2026-02-04 11:58:06'),
	(6, 'House Warming', 1, 0, '2026-02-04 11:58:06'),
	(7, 'Others', 1, 0, '2026-02-04 11:58:06'),
	(8, 'New item test', 1, 0, '2026-02-15 07:11:59');

-- Dumping structure for table customer_management_db.events
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

-- Dumping data for table customer_management_db.events: ~2 rows (approximately)
INSERT INTO `events` (`id`, `name`, `event_date`, `event_type_id`, `event_category`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
	('1efcb3e0-1f36-bcea-9acc-197eda45807f', 'Friends marriage', '2029-02-15', 2, 'customer_event', NULL, '7e2ac996-01bb-11f1-9edc-7008945b491c', '2026-02-15 20:34:51', '2026-02-15 20:34:51'),
	('5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', 'Saju Engagement', '2026-09-16', 3, 'self_event', NULL, '7e2ac996-01bb-11f1-9edc-7008945b491c', '2026-02-15 20:21:30', '2026-02-15 20:21:30');

-- Dumping structure for table customer_management_db.gift_types
CREATE TABLE IF NOT EXISTS `gift_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_gift_types_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.gift_types: ~3 rows (approximately)
INSERT INTO `gift_types` (`id`, `name`, `is_active`, `is_default`, `created_at`) VALUES
	(1, 'Cash', 1, 1, '2026-02-04 11:58:06'),
	(2, 'Physical Gift', 1, 0, '2026-02-04 11:58:06'),
	(3, 'Voucher', 1, 0, '2026-02-04 11:58:06'),
	(4, 'Others', 1, 0, '2026-02-14 07:44:11'),
	(5, 'New item gift', 1, 0, '2026-02-15 07:12:14');

-- Dumping structure for table customer_management_db.gifts
CREATE TABLE IF NOT EXISTS `gifts` (
  `id` varchar(36) NOT NULL COMMENT 'UUID',
  `event_id` varchar(36) NOT NULL COMMENT 'FK to customer_events table',
  `customer_id` varchar(36) NOT NULL,
  `gift_type_id` int(11) NOT NULL COMMENT 'FK to gift_types table',
  `value` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Gift value in currency',
  `description` text DEFAULT NULL COMMENT 'Gift description/details',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_gift_type` (`gift_type_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_gift_event` (`event_id`),
  CONSTRAINT `fk_gifts_event_new` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gifts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gifts_ibfk_2` FOREIGN KEY (`gift_type_id`) REFERENCES `gift_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.gifts: ~2 rows (approximately)
INSERT INTO `gifts` (`id`, `event_id`, `customer_id`, `gift_type_id`, `value`, `description`, `created_at`, `updated_at`) VALUES
	('036d6db0-9f91-af8f-bea6-de6c17c3645e', '5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', '2fd8ccbf-0ab1-11f1-830b-7008945b491c', 1, 5500.00, NULL, '2026-02-16 05:43:25', '2026-02-16 05:43:43'),
	('11d51924-3104-0ae1-37da-ba00f662fc80', '1efcb3e0-1f36-bcea-9acc-197eda45807f', '2fd8ccbf-0ab1-11f1-830b-7008945b491c', 1, 3000.00, NULL, '2026-02-16 05:44:26', '2026-02-16 05:44:26'),
	('8af1b717-add0-4329-909b-c73e25d8cc4c', '5c5024e5-95ec-1e1d-5ebf-906d775ac0bc', '4a36d642-0ab1-11f1-830b-7008945b491c', 2, 2000.00, 'Dress', '2026-02-16 05:44:00', '2026-02-16 05:44:00');

-- Dumping structure for table customer_management_db.invitation_status
CREATE TABLE IF NOT EXISTS `invitation_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_invitation_status_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.invitation_status: ~2 rows (approximately)
INSERT INTO `invitation_status` (`id`, `name`, `is_active`, `is_default`, `created_at`) VALUES
	(1, 'Called', 1, 1, '2026-02-04 11:58:06'),
	(2, 'Not Called', 1, 0, '2026-02-04 11:58:06'),
	(3, 'Called but no response', 1, 0, '2026-02-15 07:12:34');

-- Dumping structure for table customer_management_db.states
CREATE TABLE IF NOT EXISTS `states` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.states: ~0 rows (approximately)
INSERT INTO `states` (`id`, `name`, `code`, `created_at`) VALUES
	(1, 'Kerala', 'KL', '2026-02-04 11:58:06');

-- Dumping structure for table customer_management_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL COMMENT 'UUID',
  `name` varchar(255) NOT NULL,
  `mobile_number` varchar(10) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hashed password',
  `address` text DEFAULT NULL,
  `state_id` int(11) DEFAULT NULL,
  `district_id` int(11) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `place` varchar(255) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `role` enum('admin','superadmin') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  KEY `idx_mobile` (`mobile_number`),
  KEY `idx_role` (`role`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_users_state_id` (`state_id`),
  KEY `idx_users_district_id` (`district_id`),
  KEY `idx_users_city_id` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table customer_management_db.users: ~4 rows (approximately)
INSERT INTO `users` (`id`, `name`, `mobile_number`, `password`, `address`, `state_id`, `district_id`, `city_id`, `place`, `branch`, `role`, `created_at`, `updated_at`) VALUES
	('23176fe7-0a50-11f1-b752-7008945b491c', 'Jipin M', '8129836080', '$2y$10$yEQPS6QHSC6RSGBE6vni0.eiKuaFabeOBtRNtnVmUv5jocusLvjnO', 'Jibin bhavanam', 1, 6, 36, NULL, '', 'admin', '2026-02-15 09:24:32', '2026-02-15 20:35:28'),
	('4a3edd17-0a52-11f1-b752-7008945b491c', 'Manu Mohan', '9961117581', '$2y$10$1H9qtRvGhq//i4MsCfL.7OwMDrZTT3h6sAuAXNNJSpIY3JQ9C08xy', 'Manu mandiram', 1, 3, 15, NULL, '', 'admin', '2026-02-15 09:39:57', '2026-02-15 20:35:45'),
	('7e2ac996-01bb-11f1-9edc-7008945b491c', 'Super Admin', '9999999999', '$2y$10$6/N/oZ9sCyVqcLjqHPBjxu/E6GMCSPHhPSk5hynVjhoRpmtOFUeKm', 'Head Office, Main Street', NULL, NULL, NULL, 'Kochi', 'Headquarters', 'superadmin', '2026-02-04 11:20:21', '2026-02-14 17:00:17'),
	('beb7e58a-0aab-11f1-830b-7008945b491c', 'Ajith mohan M', '5580008525', '$2y$10$V5lPGhWRlU1QWdurMFMwWu4QLUu9EzVtoPTBu1IFFnyUKjANDI6dm', 'Ajith bhavanam', 1, 4, 21, NULL, 'Branch', 'admin', '2026-02-15 20:20:18', '2026-02-15 20:35:10');

-- Dumping structure for view customer_management_db.v_events_with_customers_gifts
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_events_with_customers_gifts` (
	`event_id` VARCHAR(1) NOT NULL COMMENT 'UUID' COLLATE 'utf8mb4_unicode_ci',
	`event_name` VARCHAR(1) NOT NULL COMMENT 'Event name' COLLATE 'utf8mb4_unicode_ci',
	`event_date` DATE NOT NULL COMMENT 'Date of the event',
	`event_type_id` INT(11) NOT NULL COMMENT 'FK to event_types table',
	`event_type_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`event_category` ENUM('self_event','customer_event') NOT NULL COMMENT 'Self Event or Customer Event' COLLATE 'utf8mb4_unicode_ci',
	`event_notes` TEXT NULL COMMENT 'Event notes' COLLATE 'utf8mb4_unicode_ci',
	`event_created_by` VARCHAR(1) NOT NULL COMMENT 'Super Admin who created the event' COLLATE 'utf8mb4_unicode_ci',
	`event_created_at` TIMESTAMP NOT NULL,
	`attachment_id` VARCHAR(1) NULL COMMENT 'UUID' COLLATE 'utf8mb4_unicode_ci',
	`customer_id` VARCHAR(1) NULL COMMENT 'FK to customers table' COLLATE 'utf8mb4_unicode_ci',
	`customer_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_mobile` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`invitation_status_id` INT(11) NULL COMMENT 'FK to invitation_status (Default: Called)',
	`invitation_status_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`care_of_id` INT(11) NULL COMMENT 'FK to care_of_options (Required for self_event)',
	`care_of_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`attached_by` VARCHAR(1) NULL COMMENT 'User who attached the customer' COLLATE 'utf8mb4_unicode_ci',
	`gift_id` VARCHAR(1) NULL COMMENT 'UUID' COLLATE 'utf8mb4_unicode_ci',
	`gift_type_id` INT(11) NULL COMMENT 'FK to gift_types table',
	`gift_type_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`gift_value` DECIMAL(10,2) NULL COMMENT 'Gift value in currency',
	`gift_description` TEXT NULL COMMENT 'Gift description/details' COLLATE 'utf8mb4_unicode_ci',
	`gift_direction` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci'
);

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_events_with_customers_gifts`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_events_with_customers_gifts` AS SELECT 
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
LEFT JOIN gift_types gt ON g.gift_type_id = gt.id 
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

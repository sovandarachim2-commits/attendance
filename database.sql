-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: attendance_sales_app
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `branch_id` bigint(20) unsigned DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'office',
  `status` varchar(255) NOT NULL DEFAULT 'present',
  `check_in_at` timestamp NULL DEFAULT NULL,
  `check_out_at` timestamp NULL DEFAULT NULL,
  `check_in_latitude` decimal(10,7) DEFAULT NULL,
  `check_in_longitude` decimal(10,7) DEFAULT NULL,
  `check_in_address` text DEFAULT NULL,
  `check_out_latitude` decimal(10,7) DEFAULT NULL,
  `check_out_longitude` decimal(10,7) DEFAULT NULL,
  `check_out_address` text DEFAULT NULL,
  `check_in_photo_path` varchar(255) DEFAULT NULL,
  `check_out_photo_path` varchar(255) DEFAULT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `late_minutes` int(10) unsigned NOT NULL DEFAULT 0,
  `work_minutes` int(10) unsigned NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `offline_sync_uuid` char(36) DEFAULT NULL,
  `synced_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_employee_id_attendance_date_unique` (`employee_id`,`attendance_date`),
  UNIQUE KEY `attendance_offline_sync_uuid_unique` (`offline_sync_uuid`),
  KEY `attendance_branch_id_foreign` (`branch_id`),
  KEY `attendance_employee_id_attendance_date_status_index` (`employee_id`,`attendance_date`,`status`),
  KEY `attendance_attendance_date_index` (`attendance_date`),
  KEY `attendance_type_index` (`type`),
  KEY `attendance_status_index` (`status`),
  KEY `attendance_qr_code_index` (`qr_code`),
  CONSTRAINT `attendance_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendance_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,3,NULL,'2026-05-17','office','late','2026-05-17 04:07:41',NULL,11.6484031,104.9075786,'Street M06, The Mekong Royal, Phum Khtor, Sangkat Prek Liep, Khan Chroy Changvar, Phnom Penh, 121002, Cambodia',NULL,NULL,NULL,NULL,NULL,NULL,158,0,'Submitted from web attendance.',NULL,'2026-05-17 04:07:41','2026-05-17 04:07:41','2026-05-17 04:07:41'),(2,1,NULL,'2026-05-17','office','late','2026-05-17 04:09:18','2026-05-17 04:14:38',11.6484031,104.9075786,'Street M06, The Mekong Royal, Phum Khtor, Sangkat Prek Liep, Khan Chroy Changvar, Phnom Penh, 121002, Cambodia',11.6483918,104.9075923,'Street M06, The Mekong Royal, Phum Khtor, Sangkat Prek Liep, Khan Chroy Changvar, Phnom Penh, 121002, Cambodia',NULL,NULL,NULL,159,5,'Submitted from web attendance.',NULL,'2026-05-17 04:09:18','2026-05-17 04:09:18','2026-05-17 04:14:38'),(3,4,NULL,'2026-05-17','office','late','2026-05-17 05:32:32','2026-05-17 05:34:38',11.6483926,104.9075825,NULL,11.6484079,104.9075823,NULL,NULL,NULL,NULL,243,2,'Submitted from web attendance.',NULL,'2026-05-17 05:32:32','2026-05-17 05:32:32','2026-05-17 05:34:38');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attendance_id` bigint(20) unsigned NOT NULL,
  `edited_by` bigint(20) unsigned DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `previous_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `reason` text NOT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_logs_edited_by_foreign` (`edited_by`),
  KEY `attendance_logs_attendance_id_edited_by_index` (`attendance_id`,`edited_by`),
  CONSTRAINT `attendance_logs_attendance_id_foreign` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_logs_edited_by_foreign` FOREIGN KEY (`edited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `attendance_radius_meters` int(10) unsigned NOT NULL DEFAULT 100,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_code_unique` (`code`),
  KEY `branches_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_visits`
--

DROP TABLE IF EXISTS `customer_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_visits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `store_name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `check_in_at` timestamp NULL DEFAULT NULL,
  `check_out_at` timestamp NULL DEFAULT NULL,
  `duration_minutes` int(10) unsigned NOT NULL DEFAULT 0,
  `selfie_path` varchar(255) DEFAULT NULL,
  `store_photo_path` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_visits_employee_id_check_in_at_index` (`employee_id`,`check_in_at`),
  KEY `customer_visits_status_index` (`status`),
  CONSTRAINT `customer_visits_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_visits`
--

LOCK TABLES `customer_visits` WRITE;
/*!40000 ALTER TABLE `customer_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_code_unique` (`code`),
  KEY `departments_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Administration','ADMIN','System administration and office operations.','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(2,'Human Resources','HR','Employee records, attendance, and staff support.','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(3,'Sales','SALES','Indoor and outdoor sales team.','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(4,'Warehouse','WH','Stock handling and warehouse operations.','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(5,'Finance','FIN','Accounting, payroll, and finance reporting.','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(6,'Delivery','DEL','Drivers and delivery operations.','active','2026-05-17 02:46:57','2026-05-17 02:46:57');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint(20) unsigned DEFAULT NULL,
  `position_id` bigint(20) unsigned DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT NULL,
  `employee_code` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `employment_type` varchar(255) NOT NULL DEFAULT 'full_time',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `face_template_status` varchar(255) NOT NULL DEFAULT 'not_enrolled',
  `require_face_verification` tinyint(1) NOT NULL DEFAULT 0,
  `require_gps` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employees_employee_code_unique` (`employee_code`),
  KEY `employees_position_id_foreign` (`position_id`),
  KEY `employees_branch_id_foreign` (`branch_id`),
  KEY `employees_department_id_position_id_branch_id_index` (`department_id`,`position_id`,`branch_id`),
  KEY `employees_status_index` (`status`),
  CONSTRAINT `employees_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,NULL,NULL,NULL,'SUPER-0001','Super','Admin',NULL,NULL,NULL,NULL,'full_time','active','not_enrolled',0,0,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(2,NULL,NULL,NULL,'ADMIN-0001','Admin','User',NULL,NULL,NULL,NULL,'full_time','active','not_enrolled',0,0,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(3,1,3,NULL,'EM-0001','Chim','Raksa','077322921','598','employees/photos/cImYpYmUuHzWsm65zZgoX41cBHiKX8hVnFQT1BjX.jpg','2026-12-01','full_time','active','not_enrolled',0,0,'2026-05-17 02:50:59','2026-05-17 02:50:59'),(4,1,10,NULL,'EM-0002','Sovandara',NULL,NULL,'Phnom Penh','employees/photos/H48yYPi6vCEF1EQT6KRuHyWfw6F97pXRvjMBkT7g.jpg','2026-05-17','full_time','active','not_enrolled',0,1,'2026-05-17 04:25:48','2026-05-17 05:19:09');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gps_locations`
--

DROP TABLE IF EXISTS `gps_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gps_locations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `attendance_id` bigint(20) unsigned DEFAULT NULL,
  `customer_visit_id` bigint(20) unsigned DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy` decimal(8,2) DEFAULT NULL,
  `speed` decimal(8,2) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `source` varchar(255) NOT NULL DEFAULT 'mobile',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gps_locations_attendance_id_foreign` (`attendance_id`),
  KEY `gps_locations_customer_visit_id_foreign` (`customer_visit_id`),
  KEY `gps_locations_employee_id_recorded_at_index` (`employee_id`,`recorded_at`),
  KEY `gps_locations_recorded_at_index` (`recorded_at`),
  KEY `gps_locations_source_index` (`source`),
  CONSTRAINT `gps_locations_attendance_id_foreign` FOREIGN KEY (`attendance_id`) REFERENCES `attendance` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gps_locations_customer_visit_id_foreign` FOREIGN KEY (`customer_visit_id`) REFERENCES `customer_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gps_locations_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gps_locations`
--

LOCK TABLES `gps_locations` WRITE;
/*!40000 ALTER TABLE `gps_locations` DISABLE KEYS */;
INSERT INTO `gps_locations` VALUES (1,3,1,NULL,11.6484031,104.9075786,83.00,0.00,'2026-05-17 04:07:41','check_in','2026-05-17 04:07:41','2026-05-17 04:07:41'),(2,1,2,NULL,11.6484031,104.9075786,83.00,0.00,'2026-05-17 04:09:18','check_in','2026-05-17 04:09:18','2026-05-17 04:09:18'),(3,1,2,NULL,11.6483918,104.9075923,87.00,0.00,'2026-05-17 04:14:38','check_out','2026-05-17 04:14:38','2026-05-17 04:14:38'),(4,4,3,NULL,11.6483926,104.9075825,87.00,0.00,'2026-05-17 05:32:32','check_in','2026-05-17 05:32:32','2026-05-17 05:32:32'),(5,4,3,NULL,11.6484079,104.9075823,81.00,0.00,'2026-05-17 05:34:38','check_out','2026-05-17 05:34:38','2026-05-17 05:34:38');
/*!40000 ALTER TABLE `gps_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_05_15_114828_create_personal_access_tokens_table',1),(5,'2026_05_15_120000_create_attendance_domain_tables',1),(6,'2026_05_16_000001_add_address_to_employees_table',1),(7,'2026_05_16_000002_make_employee_last_name_nullable',1),(8,'2026_05_16_000003_seed_role_permission_system',1),(9,'2026_05_16_000004_map_legacy_roles_to_permissions',1),(10,'2026_05_16_000005_create_default_super_admin_user',1),(11,'2026_05_16_000007_create_role_ip_addresses_table',1),(12,'2026_05_17_000001_add_permission_request_permissions',1),(13,'2026_05_17_000002_add_address_to_attendance_table',1),(14,'2026_05_17_000003_create_permission_requests_table',1),(15,'2026_05_17_000004_add_profile_update_permissions',1),(16,'2026_05_17_000005_remove_demo_accounts',1),(17,'2026_05_17_000006_create_telegram_destinations_table',2),(18,'2026_05_17_000007_add_access_flags_to_employees_table',3),(19,'2026_05_17_000008_create_system_settings_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  KEY `notifications_type_index` (`type`),
  KEY `notifications_read_at_index` (`read_at`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_requests`
--

DROP TABLE IF EXISTS `permission_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `request_code` varchar(32) NOT NULL,
  `type` varchar(255) NOT NULL,
  `request_date` date NOT NULL,
  `request_time` varchar(20) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `is_emergency` tinyint(1) NOT NULL DEFAULT 0,
  `gps_location` varchar(255) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_requests_request_code_unique` (`request_code`),
  KEY `permission_requests_reviewed_by_foreign` (`reviewed_by`),
  KEY `permission_requests_employee_id_request_date_index` (`employee_id`,`request_date`),
  KEY `permission_requests_status_index` (`status`),
  CONSTRAINT `permission_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permission_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_requests`
--

LOCK TABLES `permission_requests` WRITE;
/*!40000 ALTER TABLE `permission_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permission_role` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_role_role_id_permission_id_unique` (`role_id`,`permission_id`),
  KEY `permission_role_permission_id_foreign` (`permission_id`),
  CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_role`
--

LOCK TABLES `permission_role` WRITE;
/*!40000 ALTER TABLE `permission_role` DISABLE KEYS */;
INSERT INTO `permission_role` VALUES (1,1,13,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(2,1,7,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(3,1,12,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(4,1,9,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(5,1,11,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(6,1,8,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(7,1,16,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(8,1,4,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(9,1,24,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(10,1,5,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(11,1,15,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(12,1,20,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(13,1,6,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(14,1,17,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(15,1,19,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(16,1,22,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(17,1,3,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(18,1,21,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(19,1,18,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(20,1,2,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(21,1,25,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(22,1,23,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(23,1,1,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(24,1,10,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(25,1,14,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(26,2,13,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(27,2,7,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(28,2,26,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(29,2,27,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(30,2,11,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(31,2,8,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(32,2,16,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(33,2,15,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(34,2,20,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(35,2,6,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(36,2,17,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(37,2,19,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(38,2,21,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(39,2,18,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(40,2,10,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(41,2,14,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(42,2,28,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(43,3,13,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(44,3,7,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(45,3,26,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(46,3,27,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(47,3,11,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(48,3,8,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(49,3,30,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(50,3,20,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(51,3,21,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(52,3,32,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(54,3,31,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(55,3,29,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(56,4,35,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(57,4,40,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(58,4,26,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(59,4,37,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(60,4,39,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(61,4,38,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(62,4,34,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(63,4,14,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(64,4,36,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(65,4,33,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(66,5,26,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(67,5,45,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(68,5,42,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(69,5,41,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(70,5,43,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(71,5,44,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(72,6,47,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(73,6,48,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(74,6,50,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(75,6,46,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(76,6,49,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(77,6,52,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(78,6,55,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(79,6,51,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(80,6,53,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(81,6,54,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(82,7,46,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(83,7,56,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(84,7,57,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(85,7,58,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(86,7,55,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(87,7,53,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(88,8,47,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(89,8,48,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(90,8,46,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(91,8,55,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(92,8,53,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(93,9,47,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(94,9,48,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(95,9,46,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(96,9,49,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(97,9,59,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(98,9,60,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(99,9,53,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(100,1,67,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(101,1,68,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(102,1,66,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(103,1,69,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(104,2,67,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(105,2,66,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(106,3,67,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(107,3,66,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(108,7,68,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(109,7,69,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(110,6,68,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(111,6,69,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(112,8,68,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(113,8,69,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(114,9,68,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(115,9,69,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(116,6,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(117,7,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(118,8,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(119,1,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(120,1,71,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(121,2,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(122,2,71,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(123,3,70,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(124,3,71,'2026-05-17 02:34:15','2026-05-17 02:34:15'),(125,3,53,'2026-05-17 05:18:38','2026-05-17 05:18:38'),(126,3,56,'2026-05-17 05:18:38','2026-05-17 05:18:38'),(127,3,57,'2026-05-17 05:18:38','2026-05-17 05:18:38'),(128,3,47,'2026-05-17 05:18:38','2026-05-17 05:18:38'),(129,3,48,'2026-05-17 05:18:38','2026-05-17 05:18:38'),(130,5,53,'2026-05-17 05:20:55','2026-05-17 05:20:55'),(131,5,56,'2026-05-17 05:20:55','2026-05-17 05:20:55'),(132,5,57,'2026-05-17 05:20:55','2026-05-17 05:20:55'),(133,5,47,'2026-05-17 05:20:55','2026-05-17 05:20:55'),(134,5,48,'2026-05-17 05:20:55','2026-05-17 05:20:55'),(135,5,11,'2026-05-17 05:20:55','2026-05-17 05:20:55');
/*!40000 ALTER TABLE `permission_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`),
  KEY `permissions_group_index` (`group`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'Manage System Settings','manage_system_settings','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(2,'Manage Roles','manage_roles','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(3,'Manage Permissions','manage_permissions','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(4,'Manage Admins','manage_admins','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(5,'Manage Branches','manage_branches','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(6,'Manage Employees','manage_employees','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(7,'Create Employee','create_employee','create','2026-05-17 02:34:13','2026-05-17 02:34:13'),(8,'Edit Employee','edit_employee','edit','2026-05-17 02:34:13','2026-05-17 02:34:13'),(9,'Delete Employee','delete_employee','delete','2026-05-17 02:34:13','2026-05-17 02:34:13'),(10,'View All Attendance','view_all_attendance','view','2026-05-17 02:34:13','2026-05-17 02:34:13'),(11,'Edit Attendance','edit_attendance','edit','2026-05-17 02:34:13','2026-05-17 02:34:13'),(12,'Delete Attendance','delete_attendance','delete','2026-05-17 02:34:13','2026-05-17 02:34:13'),(13,'Approve Attendance','approve_attendance','approve','2026-05-17 02:34:13','2026-05-17 02:34:13'),(14,'View Gps Tracking','view_gps_tracking','view','2026-05-17 02:34:13','2026-05-17 02:34:13'),(15,'Manage Customer Visits','manage_customer_visits','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(16,'Export Reports','export_reports','export','2026-05-17 02:34:13','2026-05-17 02:34:13'),(17,'Manage Notifications','manage_notifications','manage','2026-05-17 02:34:13','2026-05-17 02:34:13'),(18,'Manage Qr Codes','manage_qr_codes','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(19,'Manage Office Locations','manage_office_locations','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(20,'Manage Departments','manage_departments','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(21,'Manage Positions','manage_positions','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(22,'Manage Payroll','manage_payroll','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(23,'Manage Storage','manage_storage','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(24,'Manage Api Keys','manage_api_keys','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(25,'Manage Security Settings','manage_security_settings','manage','2026-05-17 02:34:14','2026-05-17 02:34:14'),(26,'Dashboard Access','dashboard_access','dashboard','2026-05-17 02:34:14','2026-05-17 02:34:14'),(27,'Disable Employee','disable_employee','disable','2026-05-17 02:34:14','2026-05-17 02:34:14'),(28,'View Reports','view_reports','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(29,'View Employee Profiles','view_employee_profiles','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(30,'Export Attendance Reports','export_attendance_reports','export','2026-05-17 02:34:14','2026-05-17 02:34:14'),(31,'View Employee Documents','view_employee_documents','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(32,'Reset Employee Password','reset_employee_password','reset','2026-05-17 02:34:14','2026-05-17 02:34:14'),(33,'View Sales Team','view_sales_team','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(34,'View Customer Visits','view_customer_visits','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(35,'Approve Customer Visits','approve_customer_visits','approve','2026-05-17 02:34:14','2026-05-17 02:34:14'),(36,'View Sales Reports','view_sales_reports','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(37,'Export Sales Reports','export_sales_reports','export','2026-05-17 02:34:14','2026-05-17 02:34:14'),(38,'Monitor Route History','monitor_route_history','monitor','2026-05-17 02:34:14','2026-05-17 02:34:14'),(39,'Monitor Live Location','monitor_live_location','monitor','2026-05-17 02:34:14','2026-05-17 02:34:14'),(40,'Approve Daily Reports','approve_daily_reports','approve','2026-05-17 02:34:14','2026-05-17 02:34:14'),(41,'View Attendance Reports','view_attendance_reports','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(42,'Export Payroll Reports','export_payroll_reports','export','2026-05-17 02:34:14','2026-05-17 02:34:14'),(43,'View Employee Salary','view_employee_salary','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(44,'View Overtime Reports','view_overtime_reports','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(45,'Export Excel Reports','export_excel_reports','export','2026-05-17 02:34:14','2026-05-17 02:34:14'),(46,'Employee Dashboard Access','employee_dashboard_access','employee','2026-05-17 02:34:14','2026-05-17 02:34:14'),(47,'Attendance Check In','attendance_check_in','attendance','2026-05-17 02:34:14','2026-05-17 02:34:14'),(48,'Attendance Check Out','attendance_check_out','attendance','2026-05-17 02:34:14','2026-05-17 02:34:14'),(49,'Gps Tracking Access','gps_tracking_access','gps','2026-05-17 02:34:14','2026-05-17 02:34:14'),(50,'Create Customer Visit','create_customer_visit','create','2026-05-17 02:34:14','2026-05-17 02:34:14'),(51,'Upload Customer Photo','upload_customer_photo','upload','2026-05-17 02:34:14','2026-05-17 02:34:14'),(52,'Submit Daily Report','submit_daily_report','submit','2026-05-17 02:34:14','2026-05-17 02:34:14'),(53,'View Own Attendance','view_own_attendance','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(54,'View Own Reports','view_own_reports','view','2026-05-17 02:34:14','2026-05-17 02:34:14'),(55,'Update Profile','update_profile','update','2026-05-17 02:34:14','2026-05-17 02:34:14'),(56,'Office Check In','office_check_in','office','2026-05-17 02:34:14','2026-05-17 02:34:14'),(57,'Office Check Out','office_check_out','office','2026-05-17 02:34:14','2026-05-17 02:34:14'),(58,'Qr Scan Attendance','qr_scan_attendance','qr','2026-05-17 02:34:14','2026-05-17 02:34:14'),(59,'Route Tracking Access','route_tracking_access','route','2026-05-17 02:34:14','2026-05-17 02:34:14'),(60,'Update Delivery Status','update_delivery_status','update','2026-05-17 02:34:14','2026-05-17 02:34:14'),(61,'System Settings Access','system_settings_access','system','2026-05-17 02:34:14','2026-05-17 02:34:14'),(62,'Edit Customer Visit','edit_customer_visit','edit','2026-05-17 02:34:14','2026-05-17 02:34:14'),(63,'Export Pdf Reports','export_pdf_reports','export','2026-05-17 02:34:14','2026-05-17 02:34:14'),(64,'Receive Notifications','receive_notifications','receive','2026-05-17 02:34:14','2026-05-17 02:34:14'),(65,'Change Password','change_password','change','2026-05-17 02:34:14','2026-05-17 02:34:14'),(66,'View All Permission Requests','view_all_permission_requests','permission_requests','2026-05-17 02:34:15','2026-05-17 02:34:15'),(67,'Approve Permission Requests','approve_permission_requests','permission_requests','2026-05-17 02:34:15','2026-05-17 02:34:15'),(68,'Submit Permission Request','submit_permission_request','permission_requests','2026-05-17 02:34:15','2026-05-17 02:34:15'),(69,'View Own Permission Requests','view_own_permission_requests','permission_requests','2026-05-17 02:34:15','2026-05-17 02:34:15'),(70,'Update Own Profile','update_own_profile','profile','2026-05-17 02:34:15','2026-05-17 02:34:15'),(71,'Update All Profiles','update_all_profiles','profile','2026-05-17 02:34:15','2026-05-17 02:34:15');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (27,'App\\Models\\User',4,'attendance-api','1c042eb4dc570070cae61035123eeb8a08e5b894c706df2d109202fb2ff67de1','[\"*\"]','2026-05-17 05:27:17',NULL,'2026-05-17 05:21:04','2026-05-17 05:27:17'),(28,'App\\Models\\User',4,'attendance-api','c89169b898d95d5e67146d05f26c6883679ed8c6c83b33d7c9e295eda681b2d0','[\"*\"]','2026-05-17 05:36:18',NULL,'2026-05-17 05:30:21','2026-05-17 05:36:18');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `positions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `positions_code_unique` (`code`),
  KEY `positions_department_id_foreign` (`department_id`),
  KEY `positions_status_index` (`status`),
  CONSTRAINT `positions_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES (1,1,'Super Admin','SUPER_ADMIN','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(2,1,'Admin','ADMIN','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(3,2,'HR Manager','HR_MANAGER','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(4,3,'Sales Manager','SALES_MANAGER','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(5,3,'Outdoor Sales','OUTDOOR_SALES','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(6,4,'Warehouse Staff','WAREHOUSE_STAFF','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(7,5,'Accountant','ACCOUNTANT','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(8,6,'Driver','DRIVER','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(9,1,'Office Staff','OFFICE_STAFF','active','2026-05-17 02:46:57','2026-05-17 02:46:57'),(10,1,'General Manager','GENERAL_MANAGER','active','2026-05-17 04:24:10','2026-05-17 04:24:10');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `report_date` date NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'daily',
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metrics`)),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reports_employee_id_report_date_index` (`employee_id`,`report_date`),
  KEY `reports_report_date_index` (`report_date`),
  KEY `reports_type_index` (`type`),
  KEY `reports_status_index` (`status`),
  CONSTRAINT `reports_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_ip_addresses`
--

DROP TABLE IF EXISTS `role_ip_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_ip_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_ip_addresses_role_id_ip_address_unique` (`role_id`,`ip_address`),
  CONSTRAINT `role_ip_addresses_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_ip_addresses`
--

LOCK TABLES `role_ip_addresses` WRITE;
/*!40000 ALTER TABLE `role_ip_addresses` DISABLE KEYS */;
INSERT INTO `role_ip_addresses` VALUES (1,3,'192.168.110.91',NULL,'2026-05-17 02:52:34','2026-05-17 02:52:34'),(2,5,'192.168.110.91',NULL,'2026-05-17 05:20:31','2026-05-17 05:20:31');
/*!40000 ALTER TABLE `role_ip_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','super_admin','Full system owner with unrestricted access.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(2,'Admin','admin','System management access.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(3,'HR Manager','hr_manager','Employee and attendance management.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(4,'Sales Manager','sales_manager','Outdoor sales team management.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(5,'Accountant','accountant','Financial and payroll access.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(6,'Outdoor Sales','outdoor_sales','Field sales employee.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(7,'Office Staff','office_staff','Office employee.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(8,'Warehouse Staff','warehouse_staff','Warehouse employee.','2026-05-17 02:34:14','2026-05-17 02:34:14'),(9,'Driver','driver','Delivery employee.','2026-05-17 02:34:14','2026-05-17 02:34:14');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `group` varchar(50) NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'company_name','Shadow Group','general','2026-05-17 04:33:45','2026-05-17 04:54:39'),(2,'timezone','Asia/Phnom_Penh','general','2026-05-17 04:33:45','2026-05-17 04:33:45'),(3,'language','English','general','2026-05-17 04:33:45','2026-05-17 04:33:45'),(4,'currency','USD','general','2026-05-17 04:33:45','2026-05-17 04:33:45'),(5,'date_format','DD/MM/YYYY','general','2026-05-17 04:33:45','2026-05-17 04:33:45'),(6,'theme_mode','System','general','2026-05-17 04:33:45','2026-05-17 04:33:45'),(7,'check_in_time','13:00','attendance','2026-05-17 04:33:45','2026-05-17 05:16:36'),(8,'check_out_time','23:00','attendance','2026-05-17 04:33:45','2026-05-17 05:16:36'),(9,'late_minutes','30','attendance','2026-05-17 04:33:45','2026-05-17 04:37:29'),(10,'attendance_radius','100','attendance','2026-05-17 04:33:45','2026-05-17 04:33:45'),(11,'overtime_rules','After checkout time','attendance','2026-05-17 04:33:45','2026-05-17 04:33:45'),(12,'weekend_rules','Always allow','attendance','2026-05-17 04:33:45','2026-05-17 04:37:29'),(13,'work_start_time','17:05','schedule','2026-05-17 04:33:45','2026-05-17 05:17:47'),(14,'work_end_time','05:00','schedule','2026-05-17 04:33:45','2026-05-17 05:17:47'),(15,'break_time','12:00 - 13:00','schedule','2026-05-17 04:33:45','2026-05-17 04:33:45'),(16,'working_days','Monday - Saturday','schedule','2026-05-17 04:33:45','2026-05-17 04:37:35'),(17,'flexible_schedule','1','schedule','2026-05-17 04:33:45','2026-05-17 04:33:45'),(18,'gps_location_tracking','1','gps','2026-05-17 04:33:45','2026-05-17 04:33:45'),(19,'gps_fake_detection','1','gps','2026-05-17 04:33:45','2026-05-17 04:33:45'),(20,'gps_background_tracking','1','gps','2026-05-17 04:33:45','2026-05-17 04:37:43'),(21,'gps_live_tracking','1','gps','2026-05-17 04:33:45','2026-05-17 04:33:45'),(22,'jwt_expiration','120','security','2026-05-17 04:33:45','2026-05-17 04:33:45'),(23,'login_attempt_limit','5','security','2026-05-17 04:33:45','2026-05-17 04:33:45'),(24,'session_timeout','60','security','2026-05-17 04:33:45','2026-05-17 04:33:45'),(25,'device_restriction','1','security','2026-05-17 04:33:45','2026-05-17 04:41:36'),(26,'two_factor_auth','1','security','2026-05-17 04:33:45','2026-05-17 04:33:45'),(27,'telegram_bot_token','8301428258:AAHUqocDdqlkn7Prtkx4ygTYV85dxJpbPis','telegram','2026-05-17 05:01:21','2026-05-17 05:14:22'),(28,'company_logo_url','http://127.0.0.1:8000/storage/logos/zORXzCULXfRh78uIvSFyOrTmdIIM0vOVUk7hFcrI.png','general','2026-05-17 05:11:51','2026-05-17 05:11:51');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `telegram_destinations`
--

DROP TABLE IF EXISTS `telegram_destinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `telegram_destinations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `event_key` varchar(255) NOT NULL,
  `chat_id` varchar(255) NOT NULL,
  `message_thread_id` bigint(20) unsigned DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `telegram_destinations_event_key_index` (`event_key`),
  KEY `telegram_destinations_enabled_index` (`enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telegram_destinations`
--

LOCK TABLES `telegram_destinations` WRITE;
/*!40000 ALTER TABLE `telegram_destinations` DISABLE KEYS */;
INSERT INTO `telegram_destinations` VALUES (5,'Daily Attendance','daily_attendance','-1003261380002',3,1,'2026-05-17 04:38:19','2026-05-17 05:15:28');
/*!40000 ALTER TABLE `telegram_destinations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_index` (`role_id`),
  KEY `users_employee_id_index` (`employee_id`),
  KEY `users_status_index` (`status`),
  CONSTRAINT `users_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','superadmin@shadow.com',NULL,'$2y$12$Vn1a/mG5P5AALTgoRi/4ve6WLyikNWQRESwJcX5xh7yMa.KwmHw4i',1,1,'active','2026-05-17 05:19:45',NULL,'2026-05-17 02:34:14','2026-05-17 05:19:45'),(2,'Admin User','admin@shadow.com',NULL,'$2y$12$q7eSUJS0L7oXSeFzFMRB1ejJ2/edsLoWKr5T8n.SLS.ootLpS0Yuq',2,2,'active',NULL,NULL,'2026-05-17 02:34:14','2026-05-17 02:34:14'),(3,'raksa','shadowgroupteam@gmail.com',NULL,'$2y$12$ZcfTu4PYplyWjlogZkFCFewmgQ8y4gGeWtbHk49SQT9OWmPxSkQYO',7,3,'active','2026-05-17 04:51:15',NULL,'2026-05-17 02:50:59','2026-05-17 04:51:15'),(4,'dara123','sovandarachim2@gmail.com',NULL,'$2y$12$CA4Qn94Y5LLXzF.wArWsYe95S4ULghWFDd6yNoqnUt2V4w5REzNAq',5,4,'active','2026-05-17 05:30:21',NULL,'2026-05-17 04:25:48','2026-05-17 05:30:21');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-17 19:39:50

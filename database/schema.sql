CREATE DATABASE IF NOT EXISTS attendance_sales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_sales;

-- Laravel migrations are the source of truth. This schema mirrors the generated tables.
-- Core tables: users, roles, permissions, departments, positions, branches, employees,
-- attendance, attendance_logs, customer_visits, reports, gps_locations, notifications,
-- personal_access_tokens, jobs, cache.

CREATE TABLE roles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE permissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  `group` VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX permissions_group_index (`group`)
);

CREATE TABLE departments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX departments_status_index (status)
);

CREATE TABLE branches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL UNIQUE,
  address TEXT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  attendance_radius_meters INT UNSIGNED NOT NULL DEFAULT 100,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE positions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE employees (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NULL,
  position_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  employee_code VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL,
  hire_date DATE NULL,
  employment_type VARCHAR(255) NOT NULL DEFAULT 'full_time',
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  face_template_status VARCHAR(255) NOT NULL DEFAULT 'not_enrolled',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role_id BIGINT UNSIGNED NULL,
  employee_id BIGINT UNSIGNED NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE attendance (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  attendance_date DATE NOT NULL,
  type VARCHAR(255) NOT NULL DEFAULT 'office',
  status VARCHAR(255) NOT NULL DEFAULT 'present',
  check_in_at TIMESTAMP NULL,
  check_out_at TIMESTAMP NULL,
  check_in_latitude DECIMAL(10,7) NULL,
  check_in_longitude DECIMAL(10,7) NULL,
  check_out_latitude DECIMAL(10,7) NULL,
  check_out_longitude DECIMAL(10,7) NULL,
  check_in_photo_path VARCHAR(255) NULL,
  check_out_photo_path VARCHAR(255) NULL,
  qr_code VARCHAR(255) NULL,
  late_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  work_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NULL,
  offline_sync_uuid CHAR(36) NULL UNIQUE,
  synced_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY attendance_employee_day_unique (employee_id, attendance_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE attendance_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attendance_id BIGINT UNSIGNED NOT NULL,
  edited_by BIGINT UNSIGNED NULL,
  field_name VARCHAR(255) NOT NULL,
  previous_value TEXT NULL,
  new_value TEXT NULL,
  reason TEXT NOT NULL,
  ip_address VARCHAR(255) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
  FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE customer_visits (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  store_name VARCHAR(255) NULL,
  contact_person VARCHAR(255) NULL,
  phone VARCHAR(255) NULL,
  address TEXT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  check_in_at TIMESTAMP NULL,
  check_out_at TIMESTAMP NULL,
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  selfie_path VARCHAR(255) NULL,
  store_photo_path VARCHAR(255) NULL,
  notes TEXT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE gps_locations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  attendance_id BIGINT UNSIGNED NULL,
  customer_visit_id BIGINT UNSIGNED NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(8,2) NULL,
  speed DECIMAL(8,2) NULL,
  recorded_at TIMESTAMP NOT NULL,
  source VARCHAR(255) NOT NULL DEFAULT 'mobile',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_visit_id) REFERENCES customer_visits(id) ON DELETE SET NULL
);

CREATE TABLE reports (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  report_date DATE NOT NULL,
  type VARCHAR(255) NOT NULL DEFAULT 'daily',
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  metrics JSON NULL,
  submitted_at TIMESTAMP NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  payload JSON NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

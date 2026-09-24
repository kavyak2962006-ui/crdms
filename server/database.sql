-- CRDM Database SQL Script
-- Campus Recruitment and Development Management

CREATE DATABASE IF NOT EXISTS `crdm_db`;
USE `crdm_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'hr', 'tpo', 'admin') NOT NULL,
  `status` ENUM('pending', 'active', 'blocked') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT NULL,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS `student_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `student_id` VARCHAR(50) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `year` VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 3. HR Profiles Table
CREATE TABLE IF NOT EXISTS `hr_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `company_name` VARCHAR(255) NOT NULL,
  `designation` VARCHAR(100),
   `created_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 4. Password OTPs Table
CREATE TABLE IF NOT EXISTS `password_otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `otp` VARCHAR(10) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
   `created_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 6. Job Postings Table (Optional recruitment data support)
CREATE TABLE IF NOT EXISTS `job_postings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hr_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('open', 'closed') DEFAULT 'open',
  `ctc` VARCHAR(100) DEFAULT NULL,
  `eligibility_criteria` TEXT DEFAULT NULL,
  `registration_opening` DATETIME DEFAULT NULL,
  `registration_closing` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`hr_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 7. Applications Table (Optional recruitment data support)
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `job_id` INT NOT NULL,
  `status` ENUM('Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected') DEFAULT 'Applied',
   `created_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`job_id`) REFERENCES `job_postings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
-- 8. Company Profiles Table (new)
CREATE TABLE IF NOT EXISTS `company_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hr_user_id` INT NOT NULL UNIQUE,
  `logo` VARCHAR(255) NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `industry` VARCHAR(255) NULL,
  `website` VARCHAR(255) NULL,
  `company_email` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state_name` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `company_size` VARCHAR(100) NULL,
  `founded_year` INT NULL,
  `description` TEXT NULL,
  `culture` TEXT NULL,
  `benefits` TEXT NULL,
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`hr_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

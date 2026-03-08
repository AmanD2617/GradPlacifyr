-- Placement Portal Database Schema
CREATE DATABASE IF NOT EXISTS placement_portal;
USE placement_portal;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin','recruiter','hod') NOT NULL DEFAULT 'student',
  name VARCHAR(255),
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expire DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  created_by INT,
  ctc VARCHAR(50),
  location VARCHAR(255),
  description TEXT,
  requirements TEXT,
  status ENUM('open','closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM(
    'applied',
    'eligible',
    'shortlisted',
    'test_scheduled',
    'interview_scheduled',
    'selected',
    'rejected'
  ) DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_job_student (job_id, student_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id INT PRIMARY KEY,
  tenth_percentage DECIMAL(5,2),
  twelfth_percentage DECIMAL(5,2),
  backlogs INT,
  graduation_year INT,
  programming_languages TEXT,
  frameworks TEXT,
  tools TEXT,
  certifications TEXT,
  projects_json LONGTEXT,
  internship_experience TEXT,
  achievements TEXT,
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  ai_resume_json LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Create Database
CREATE DATABASE IF NOT EXISTS bookworm_db;
USE bookworm_db;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  bio TEXT,
  city VARCHAR(100),
  favorite_genre VARCHAR(100),
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_firebase_uid (firebase_uid),
  INDEX idx_email (email)
);

-- Books Table
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  genre VARCHAR(100),
  description LONGTEXT,
  cover_image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_firebase_uid (firebase_uid),
  INDEX idx_genre (genre),
  INDEX idx_title (title)
);

-- Book Reviews Table (optional - for later)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_book_id (book_id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY unique_user_book_review (book_id, user_id)
);

-- Favorites/Wishlist Table (optional - for later)
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_book_wishlist (user_id, book_id),
  INDEX idx_user_id (user_id)
);

-- Create default admin user (optional)
-- INSERT INTO users (firebase_uid, email, full_name)
-- VALUES ('test-uid-123', 'admin@bookworm.com', 'Admin User');

-- Rename auth UID columns from Supabase to Firebase
-- Run this against your MySQL database once.

ALTER TABLE users
  CHANGE COLUMN supabase_uid firebase_uid VARCHAR(255) NOT NULL;

-- Only if books currently has supabase_uid
ALTER TABLE books
  CHANGE COLUMN supabase_uid firebase_uid VARCHAR(255) NOT NULL;

-- Optional: recreate indexes after rename
-- ALTER TABLE users ADD UNIQUE INDEX idx_firebase_uid (firebase_uid);
-- ALTER TABLE books ADD INDEX idx_firebase_uid (firebase_uid);

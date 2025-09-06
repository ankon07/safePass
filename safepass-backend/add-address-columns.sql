-- Migration script to add blockchain address columns to existing users table
-- Run this script on your existing database to add the missing columns

-- Add the new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS worker_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_address VARCHAR(42);

-- Update the user_profiles view to include the new columns
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    email,
    name,
    role,
    did,
    worker_address,
    agency_address,
    created_at,
    updated_at
FROM users;

-- Optional: Add some sample addresses for testing (remove in production)
-- UPDATE users SET worker_address = '0x' || substr(md5(random()::text), 1, 40) WHERE role = 'Worker' AND worker_address IS NULL;
-- UPDATE users SET agency_address = '0x' || substr(md5(random()::text), 1, 40) WHERE role = 'AgencyAdmin' AND agency_address IS NULL;

-- Add indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_users_worker_address ON users(worker_address);
CREATE INDEX IF NOT EXISTS idx_users_agency_address ON users(agency_address);

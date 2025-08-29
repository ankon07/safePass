-- Temporary fix for ZKP RLS policy issues
-- Run this in Supabase SQL editor

-- Option 1: Temporarily disable RLS for zkp_license_proofs (for testing)
ALTER TABLE zkp_license_proofs DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a more permissive policy for testing
-- (Uncomment if you prefer to keep RLS enabled)
/*
DROP POLICY IF EXISTS "Allow service inserts for ZKP proofs" ON zkp_license_proofs;
CREATE POLICY "Allow service inserts for ZKP proofs" ON zkp_license_proofs
    FOR INSERT WITH CHECK (true);
*/

-- Also ensure the users table has blockchain_address column
-- (This should already exist from previous phases)
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_address VARCHAR(255);

-- Update the test agency user with a blockchain address
UPDATE users 
SET blockchain_address = '0x1234567890123456789012345678901234567890'
WHERE email = 'astro@safepass.com';

-- Verify the update
SELECT id, email, role, blockchain_address FROM users WHERE email = 'astro@safepass.com';

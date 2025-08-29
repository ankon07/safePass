-- SafePass Complete Database Setup for Supabase
-- Execute this entire script in your Supabase SQL Editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS verifiable_credentials CASCADE;
DROP TABLE IF EXISTS document_uploads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Worker', 'AgencyAdmin', 'Regulator')),
    did VARCHAR(255) UNIQUE NOT NULL,
    encrypted_private_key_hex TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create document_uploads table for tracking document verification status
CREATE TABLE document_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PendingVerification' 
        CHECK (status IN ('PendingVerification', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    reviewer_id UUID REFERENCES users(id)
);

-- Create verifiable_credentials table for storing issued VCs
CREATE TABLE verifiable_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holder_did VARCHAR(255) NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    issuance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_vc_jwt TEXT NOT NULL,
    source_document_id UUID NOT NULL REFERENCES document_uploads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for document_uploads updated_at
CREATE TRIGGER update_document_uploads_updated_at 
    BEFORE UPDATE ON document_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX idx_document_uploads_status ON document_uploads(status);
CREATE INDEX idx_document_uploads_created_at ON document_uploads(created_at);
CREATE INDEX idx_verifiable_credentials_holder_did ON verifiable_credentials(holder_did);
CREATE INDEX idx_verifiable_credentials_issuer_did ON verifiable_credentials(issuer_did);
CREATE INDEX idx_verifiable_credentials_type ON verifiable_credentials(type);

-- DISABLE Row Level Security for custom authentication
-- This is necessary because the app uses custom JWT tokens, not Supabase Auth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to allow API access
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON document_uploads TO authenticated;
GRANT ALL ON document_uploads TO anon;
GRANT ALL ON verifiable_credentials TO authenticated;
GRANT ALL ON verifiable_credentials TO anon;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create a view for public user profiles (without sensitive data)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    email,
    name,
    role,
    did,
    created_at,
    updated_at
FROM users;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Insert test data if needed (uncomment if you want to recreate test users)
/*
INSERT INTO users (email, password_hash, name, role, did, encrypted_private_key_hex) VALUES
('worker@test.com', '$2b$10$hash1', 'Test Worker', 'Worker', 'did:ethr:besu:0x036a5168418c5981647a97247d2ee1f41b97040b15867d71d7d5198e97d4e6bd4c', 'encrypted_key_1'),
('regulator@test.com', '$2b$10$hash2', 'Test Regulator', 'Regulator', 'did:ethr:besu:0x03b8bd2dc9677d4636196b69b785f5d43c2f543e61ae0057d39671e585af8d3c8d', 'encrypted_key_2')
ON CONFLICT (email) DO NOTHING;
*/

-- Verify the setup
SELECT 'Setup completed successfully!' as status;
SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'document_uploads', 'verifiable_credentials');

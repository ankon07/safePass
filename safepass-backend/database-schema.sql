-- SafePass Database Schema for Supabase
-- This file contains the SQL commands to create the required tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Worker', 'AgencyAdmin', 'Regulator')),
    did VARCHAR(255) UNIQUE NOT NULL,
    encrypted_private_key_hex TEXT NOT NULL,
    worker_address VARCHAR(255), -- Blockchain address for Worker users
    agency_address VARCHAR(255), -- Blockchain address for AgencyAdmin users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data (except sensitive fields)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Only authenticated users can insert (registration handled by API)
CREATE POLICY "Authenticated users can register" ON users
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO anon;

-- Create a view for public user profiles (without sensitive data)
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

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Create document_uploads table for tracking document verification status
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PendingVerification' 
        CHECK (status IN ('PendingVerification', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    reviewer_id UUID REFERENCES users(id)
);

-- Create verifiable_credentials table for storing issued VCs
CREATE TABLE IF NOT EXISTS verifiable_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holder_did VARCHAR(255) NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    issuance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_vc_jwt TEXT NOT NULL,
    source_document_id UUID NOT NULL REFERENCES document_uploads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_created_at ON document_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_holder_did ON verifiable_credentials(holder_did);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_issuer_did ON verifiable_credentials(issuer_did);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_type ON verifiable_credentials(type);

-- Enable RLS for new tables
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_uploads
-- Workers can view their own document uploads
CREATE POLICY "Workers can view own documents" ON document_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = document_uploads.user_id 
            AND users.id::text = auth.uid()::text
            AND users.role = 'Worker'
        )
    );

-- Workers can insert their own document uploads
CREATE POLICY "Workers can upload documents" ON document_uploads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = document_uploads.user_id 
            AND users.id::text = auth.uid()::text
            AND users.role = 'Worker'
        )
    );

-- Regulators can view all document uploads
CREATE POLICY "Regulators can view all documents" ON document_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Regulators can update document status
CREATE POLICY "Regulators can update document status" ON document_uploads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for verifiable_credentials
-- Users can view credentials where they are the holder
CREATE POLICY "Users can view own credentials" ON verifiable_credentials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.did = verifiable_credentials.holder_did 
            AND users.id::text = auth.uid()::text
        )
    );

-- Regulators can view all credentials they issued
CREATE POLICY "Regulators can view issued credentials" ON verifiable_credentials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.did = verifiable_credentials.issuer_did 
            AND users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Regulators can insert credentials
CREATE POLICY "Regulators can issue credentials" ON verifiable_credentials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.did = verifiable_credentials.issuer_did 
            AND users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Grant permissions for new tables
GRANT SELECT, INSERT, UPDATE ON document_uploads TO authenticated;
GRANT SELECT, INSERT ON verifiable_credentials TO authenticated;

-- Create triggers for updated_at on document_uploads
CREATE TRIGGER update_document_uploads_updated_at 
    BEFORE UPDATE ON document_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

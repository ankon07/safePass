-- ZKP (Zero-Knowledge Proof) Database Schema for SafePass
-- This file contains the SQL commands to create ZKP-related tables

-- Create zkp_merkle_trees table for storing valid license lists
CREATE TABLE IF NOT EXISTS zkp_merkle_trees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_name VARCHAR(255) NOT NULL,
    tree_data JSONB NOT NULL,
    leaf_count INTEGER NOT NULL DEFAULT 0,
    tree_height INTEGER NOT NULL DEFAULT 0,
    merkle_root VARCHAR(255) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zkp_license_proofs table for storing generated ZKP proofs
CREATE TABLE IF NOT EXISTS zkp_license_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_address VARCHAR(255) NOT NULL,
    license_number VARCHAR(255) NOT NULL,
    proof_data JSONB NOT NULL,
    public_signals JSONB NOT NULL,
    merkle_root VARCHAR(255) NOT NULL,
    circuit_type VARCHAR(100) NOT NULL DEFAULT 'simple_membership',
    is_valid BOOLEAN NOT NULL DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES users(id), -- Track who generated this proof (regulator)
    metadata JSONB, -- Additional metadata about proof generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zkp_merkle_trees_name ON zkp_merkle_trees(tree_name);
CREATE INDEX IF NOT EXISTS idx_zkp_merkle_trees_current ON zkp_merkle_trees(is_current);
CREATE INDEX IF NOT EXISTS idx_zkp_merkle_trees_created_by ON zkp_merkle_trees(created_by);

CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_agency_id ON zkp_license_proofs(agency_id);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_license_number ON zkp_license_proofs(license_number);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_is_valid ON zkp_license_proofs(is_valid);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_created_by ON zkp_license_proofs(created_by);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_expires_at ON zkp_license_proofs(expires_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_zkp_merkle_trees_updated_at 
    BEFORE UPDATE ON zkp_merkle_trees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zkp_license_proofs_updated_at 
    BEFORE UPDATE ON zkp_license_proofs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE zkp_merkle_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE zkp_license_proofs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zkp_merkle_trees
-- Regulators can manage valid license lists
CREATE POLICY "Regulators can manage merkle trees" ON zkp_merkle_trees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- All authenticated users can read current valid license lists
CREATE POLICY "All users can read current merkle trees" ON zkp_merkle_trees
    FOR SELECT USING (is_current = true);

-- RLS Policies for zkp_license_proofs
-- Agencies can view their own proofs
CREATE POLICY "Agencies can view own proofs" ON zkp_license_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = zkp_license_proofs.agency_id 
            AND users.id::text = auth.uid()::text
            AND users.role = 'AgencyAdmin'
        )
    );

-- Regulators can view and manage all proofs
CREATE POLICY "Regulators can manage all proofs" ON zkp_license_proofs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Workers can view proofs for verification (read-only)
CREATE POLICY "Workers can view proofs for verification" ON zkp_license_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Worker'
        )
        AND is_valid = true
        AND expires_at > NOW()
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON zkp_merkle_trees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON zkp_license_proofs TO authenticated;

-- Grant read access to anonymous users for proof verification
GRANT SELECT ON zkp_license_proofs TO anon;

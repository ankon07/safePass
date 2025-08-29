-- Phase 6 Database Schema Extensions for SafePass
-- Trust Score System and ZKP Implementation

-- Agency trust scores with historical tracking
CREATE TABLE IF NOT EXISTS agency_trust_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_address VARCHAR(255) NOT NULL,
    agency_did VARCHAR(255),
    trust_score INTEGER NOT NULL DEFAULT 1000, -- Scaled by 10 (1000 = 100.0)
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    successful_placements INTEGER DEFAULT 0,
    verified_complaints INTEGER DEFAULT 0,
    score_change INTEGER DEFAULT 0,
    calculation_details JSONB, -- Store calculation breakdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust score events for audit trail
CREATE TABLE IF NOT EXISTS trust_score_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_address VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('successful_placement', 'verified_complaint', 'manual_adjustment', 'initial_score')),
    contract_address VARCHAR(255), -- Reference to employment contract if applicable
    employment_contract_id UUID, -- Reference to our database record
    impact_score INTEGER NOT NULL, -- Positive or negative impact
    event_data JSONB, -- Additional event details
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurable trust score parameters
CREATE TABLE IF NOT EXISTS trust_score_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parameter_name VARCHAR(50) UNIQUE NOT NULL,
    parameter_value DECIMAL(10,2) NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ZKP license proofs storage
CREATE TABLE IF NOT EXISTS zkp_license_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agency_address VARCHAR(255) NOT NULL,
    proof_data JSONB NOT NULL, -- The actual ZKP proof
    public_signals JSONB NOT NULL, -- Public inputs to the proof
    merkle_root VARCHAR(255) NOT NULL, -- The Merkle root used for verification
    circuit_type VARCHAR(50) DEFAULT 'license_verification',
    is_valid BOOLEAN DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ZKP verification keys and circuit metadata
CREATE TABLE IF NOT EXISTS zkp_verification_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    circuit_name VARCHAR(100) NOT NULL,
    key_type VARCHAR(50) NOT NULL CHECK (key_type IN ('proving_key', 'verification_key')),
    key_data JSONB NOT NULL,
    circuit_hash VARCHAR(255), -- Hash of the circuit for integrity
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employment contract outcomes for trust score calculation
CREATE TABLE IF NOT EXISTS employment_contract_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address VARCHAR(255) NOT NULL,
    worker_address VARCHAR(255) NOT NULL,
    employer_address VARCHAR(255) NOT NULL,
    agency_address VARCHAR(255), -- May be null if direct employment
    final_status VARCHAR(50) NOT NULL CHECK (final_status IN ('Completed', 'Disputed_Worker_Favor', 'Disputed_Employer_Favor', 'Cancelled')),
    completion_date TIMESTAMP WITH TIME ZONE,
    total_payments DECIMAL(18,2) DEFAULT 0,
    dispute_details JSONB,
    trust_score_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merkle tree data for ZKP license verification
CREATE TABLE IF NOT EXISTS zkp_merkle_trees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_name VARCHAR(100) NOT NULL,
    merkle_root VARCHAR(255) NOT NULL,
    tree_data JSONB NOT NULL, -- Store the tree structure
    leaf_count INTEGER NOT NULL,
    tree_height INTEGER NOT NULL,
    is_current BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agency_trust_scores_address ON agency_trust_scores(agency_address);
CREATE INDEX IF NOT EXISTS idx_agency_trust_scores_calculated_at ON agency_trust_scores(calculated_at);
CREATE INDEX IF NOT EXISTS idx_agency_trust_scores_score ON agency_trust_scores(trust_score);

CREATE INDEX IF NOT EXISTS idx_trust_score_events_agency ON trust_score_events(agency_address);
CREATE INDEX IF NOT EXISTS idx_trust_score_events_type ON trust_score_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trust_score_events_processed_at ON trust_score_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_trust_score_events_contract ON trust_score_events(contract_address);

CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_agency ON zkp_license_proofs(agency_id);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_address ON zkp_license_proofs(agency_address);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_merkle_root ON zkp_license_proofs(merkle_root);
CREATE INDEX IF NOT EXISTS idx_zkp_license_proofs_valid ON zkp_license_proofs(is_valid);

CREATE INDEX IF NOT EXISTS idx_employment_outcomes_contract ON employment_contract_outcomes(contract_address);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_agency ON employment_contract_outcomes(agency_address);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_status ON employment_contract_outcomes(final_status);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_processed ON employment_contract_outcomes(trust_score_processed);

CREATE INDEX IF NOT EXISTS idx_zkp_merkle_trees_root ON zkp_merkle_trees(merkle_root);
CREATE INDEX IF NOT EXISTS idx_zkp_merkle_trees_current ON zkp_merkle_trees(is_current);

-- Insert default trust score configuration parameters
INSERT INTO trust_score_config (parameter_name, parameter_value, description) VALUES
('alpha_successful_placement', 1.0, 'Points added for each successful employment placement'),
('beta_verified_complaint', 10.0, 'Points deducted for each verified complaint'),
('gamma_dispute_resolution', 5.0, 'Points deducted for disputes resolved against agency'),
('min_trust_score', 0.0, 'Minimum possible trust score'),
('max_trust_score', 200.0, 'Maximum possible trust score'),
('default_trust_score', 100.0, 'Default trust score for new agencies'),
('calculation_frequency_hours', 24.0, 'How often to recalculate trust scores (in hours)')
ON CONFLICT (parameter_name) DO NOTHING;

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE agency_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zkp_license_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zkp_verification_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contract_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zkp_merkle_trees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_trust_scores
-- Anyone can view trust scores (public information)
CREATE POLICY "Public can view trust scores" ON agency_trust_scores
    FOR SELECT USING (true);

-- Only regulators can insert/update trust scores
CREATE POLICY "Regulators can manage trust scores" ON agency_trust_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for trust_score_events
-- Anyone can view events (transparency)
CREATE POLICY "Public can view trust score events" ON trust_score_events
    FOR SELECT USING (true);

-- Only regulators can insert events
CREATE POLICY "Regulators can create trust score events" ON trust_score_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for trust_score_config
-- Anyone can view config (transparency)
CREATE POLICY "Public can view trust score config" ON trust_score_config
    FOR SELECT USING (true);

-- Only regulators can modify config
CREATE POLICY "Regulators can manage trust score config" ON trust_score_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for zkp_license_proofs
-- Agencies can view their own proofs
CREATE POLICY "Agencies can view own ZKP proofs" ON zkp_license_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = zkp_license_proofs.agency_id
            AND users.id::text = auth.uid()::text
        )
    );

-- Agencies can create their own proofs
CREATE POLICY "Agencies can create ZKP proofs" ON zkp_license_proofs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = zkp_license_proofs.agency_id
            AND users.id::text = auth.uid()::text
            AND users.role IN ('AgencyAdmin', 'Regulator')
        )
    );

-- Anyone can verify proofs (public verification)
CREATE POLICY "Public can verify ZKP proofs" ON zkp_license_proofs
    FOR SELECT USING (is_valid = true);

-- RLS Policies for zkp_verification_keys
-- Anyone can view verification keys (needed for public verification)
CREATE POLICY "Public can view verification keys" ON zkp_verification_keys
    FOR SELECT USING (key_type = 'verification_key' AND is_active = true);

-- Only regulators can manage keys
CREATE POLICY "Regulators can manage verification keys" ON zkp_verification_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for employment_contract_outcomes
-- Anyone can view outcomes (transparency)
CREATE POLICY "Public can view contract outcomes" ON employment_contract_outcomes
    FOR SELECT USING (true);

-- Only regulators can manage outcomes
CREATE POLICY "Regulators can manage contract outcomes" ON employment_contract_outcomes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- RLS Policies for zkp_merkle_trees
-- Anyone can view current merkle trees (needed for proof generation)
CREATE POLICY "Public can view current merkle trees" ON zkp_merkle_trees
    FOR SELECT USING (is_current = true);

-- Only regulators can manage merkle trees
CREATE POLICY "Regulators can manage merkle trees" ON zkp_merkle_trees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'Regulator'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON agency_trust_scores TO authenticated, anon;
GRANT SELECT ON trust_score_events TO authenticated, anon;
GRANT SELECT ON trust_score_config TO authenticated, anon;
GRANT SELECT, INSERT ON zkp_license_proofs TO authenticated;
GRANT SELECT ON zkp_verification_keys TO authenticated, anon;
GRANT SELECT ON employment_contract_outcomes TO authenticated, anon;
GRANT SELECT ON zkp_merkle_trees TO authenticated, anon;

-- Grant full access to regulators (handled by RLS policies)
GRANT ALL ON agency_trust_scores TO authenticated;
GRANT ALL ON trust_score_events TO authenticated;
GRANT ALL ON trust_score_config TO authenticated;
GRANT ALL ON zkp_verification_keys TO authenticated;
GRANT ALL ON employment_contract_outcomes TO authenticated;
GRANT ALL ON zkp_merkle_trees TO authenticated;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_agency_trust_scores_updated_at 
    BEFORE UPDATE ON agency_trust_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_score_config_updated_at 
    BEFORE UPDATE ON trust_score_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for current agency trust scores (latest score per agency)
CREATE OR REPLACE VIEW current_agency_trust_scores AS
SELECT DISTINCT ON (agency_address)
    agency_address,
    agency_did,
    trust_score,
    successful_placements,
    verified_complaints,
    calculated_at,
    score_change
FROM agency_trust_scores
ORDER BY agency_address, calculated_at DESC;

-- Grant access to the view
GRANT SELECT ON current_agency_trust_scores TO authenticated, anon;

-- Create a view for trust score statistics
CREATE OR REPLACE VIEW trust_score_statistics AS
SELECT 
    COUNT(*) as total_agencies,
    AVG(trust_score) as average_score,
    MIN(trust_score) as min_score,
    MAX(trust_score) as max_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY trust_score) as median_score,
    COUNT(CASE WHEN trust_score >= 1000 THEN 1 END) as agencies_above_100,
    COUNT(CASE WHEN trust_score < 500 THEN 1 END) as agencies_below_50
FROM current_agency_trust_scores;

-- Grant access to the statistics view
GRANT SELECT ON trust_score_statistics TO authenticated, anon;

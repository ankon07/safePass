-- Merkle Tree Verification System Database Schema
-- Add these tables to support transaction verification and anchoring

-- Store anchoring batches and their metadata
CREATE TABLE IF NOT EXISTS anchoring_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id INTEGER UNIQUE NOT NULL,
    merkle_root VARCHAR(66) NOT NULL,
    transaction_count INTEGER NOT NULL,
    anchored_at TIMESTAMP NOT NULL,
    sepolia_tx_hash VARCHAR(66) NOT NULL,
    sepolia_block_number BIGINT NOT NULL,
    besu_start_block BIGINT NOT NULL,
    besu_end_block BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Store individual transactions and their Merkle proofs
CREATE TABLE IF NOT EXISTS batch_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id INTEGER REFERENCES anchoring_batches(batch_id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66) NOT NULL,
    besu_block_number BIGINT NOT NULL,
    transaction_index INTEGER NOT NULL,
    merkle_proof JSONB NOT NULL, -- Store the proof path as JSON
    leaf_index INTEGER NOT NULL, -- Position in the Merkle tree
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store anchoring service status and configuration
CREATE TABLE IF NOT EXISTS anchoring_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL DEFAULT 'daily_anchoring',
    last_run_at TIMESTAMP,
    last_success_at TIMESTAMP,
    last_error_at TIMESTAMP,
    last_error_message TEXT,
    next_scheduled_run TIMESTAMP,
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_batch_transactions_hash ON batch_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_batch ON batch_transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_anchoring_batches_batch_id ON anchoring_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_anchoring_batches_anchored_at ON anchoring_batches(anchored_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_besu_block ON batch_transactions(besu_block_number);

-- Insert initial anchoring service status
INSERT INTO anchoring_status (service_name, is_enabled, configuration) 
VALUES ('daily_anchoring', true, '{"schedule": "0 2 * * *", "batch_size": 1000}')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE anchoring_batches IS 'Stores information about batches of transactions anchored to Sepolia';
COMMENT ON TABLE batch_transactions IS 'Maps individual transactions to their anchoring batches with Merkle proofs';
COMMENT ON TABLE anchoring_status IS 'Tracks the status and configuration of the anchoring service';

COMMENT ON COLUMN anchoring_batches.merkle_root IS 'The Merkle root hash anchored to Sepolia blockchain';
COMMENT ON COLUMN anchoring_batches.sepolia_tx_hash IS 'Transaction hash of the anchoring transaction on Sepolia';
COMMENT ON COLUMN batch_transactions.merkle_proof IS 'JSON array of proof elements for Merkle tree verification';
COMMENT ON COLUMN batch_transactions.leaf_index IS 'Index of this transaction in the Merkle tree leaves array';

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { createClient } = require('@supabase/supabase-js');

class MerkleProofService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
    }

    /**
     * Generate Merkle proof for a specific transaction
     * @param {string} transactionHash - The transaction hash to generate proof for
     * @returns {Object} Proof object with all necessary verification data
     */
    async generateProof(transactionHash) {
        try {
            console.log(`🔍 Generating proof for transaction: ${transactionHash}`);

            // Find which batch contains this transaction
            const batchInfo = await this.findBatchForTransaction(transactionHash);
            if (!batchInfo) {
                throw new Error(`Transaction ${transactionHash} not found in any anchored batch`);
            }

            // Get the stored proof from database
            const storedProof = await this.getStoredProof(transactionHash, batchInfo.batch_id);
            if (storedProof) {
                console.log(`✅ Found stored proof for transaction in batch ${batchInfo.batch_id}`);
                return {
                    transactionHash,
                    batchId: batchInfo.batch_id,
                    merkleRoot: batchInfo.merkle_root,
                    proof: storedProof.merkle_proof,
                    leafIndex: storedProof.leaf_index,
                    sepoliaContract: process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS,
                    sepoliaTxHash: batchInfo.sepolia_tx_hash,
                    anchoredAt: batchInfo.anchored_at,
                    verificationUrl: `https://sepolia.etherscan.io/tx/${batchInfo.sepolia_tx_hash}`
                };
            }

            throw new Error('Proof not found in database');
        } catch (error) {
            console.error('❌ Error generating proof:', error);
            throw error;
        }
    }

    /**
     * Find which batch contains a specific transaction
     * @param {string} transactionHash - Transaction hash to search for
     * @returns {Object|null} Batch information or null if not found
     */
    async findBatchForTransaction(transactionHash) {
        const { data, error } = await this.supabase
            .from('batch_transactions')
            .select(`
                *,
                anchoring_batches (*)
            `)
            .eq('transaction_hash', transactionHash)
            .limit(1)
            .single();
        
        if (error) {
            console.error('Error finding batch for transaction:', error);
            return null;
        }
        
        if (!data || !data.anchoring_batches) {
            return null;
        }
        
        return {
            ...data.anchoring_batches,
            leaf_index: data.leaf_index
        };
    }

    /**
     * Get stored Merkle proof for a transaction
     * @param {string} transactionHash - Transaction hash
     * @param {number} batchId - Batch ID
     * @returns {Object|null} Stored proof data
     */
    async getStoredProof(transactionHash, batchId) {
        const { data, error } = await this.supabase
            .from('batch_transactions')
            .select('merkle_proof, leaf_index, transaction_index')
            .eq('transaction_hash', transactionHash)
            .eq('batch_id', batchId)
            .limit(1)
            .single();
        
        if (error) {
            console.error('Error getting stored proof:', error);
            return null;
        }
        
        return data;
    }

    /**
     * Verify a Merkle proof locally (without blockchain call)
     * @param {string} transactionHash - Transaction hash to verify
     * @param {Array} proof - Merkle proof array
     * @param {string} merkleRoot - Expected Merkle root
     * @returns {boolean} True if proof is valid
     */
    verifyProof(transactionHash, proof, merkleRoot) {
        try {
            let computedHash = keccak256(transactionHash);
            
            for (const proofElement of proof) {
                const proofHash = Buffer.from(proofElement.data.replace('0x', ''), 'hex');
                if (proofElement.position === 'left') {
                    computedHash = keccak256(Buffer.concat([proofHash, computedHash]));
                } else {
                    computedHash = keccak256(Buffer.concat([computedHash, proofHash]));
                }
            }
            
            const computedRoot = '0x' + computedHash.toString('hex');
            const expectedRoot = merkleRoot.startsWith('0x') ? merkleRoot : '0x' + merkleRoot;
            
            return computedRoot === expectedRoot;
        } catch (error) {
            console.error('❌ Error verifying proof:', error);
            return false;
        }
    }

    /**
     * Build Merkle tree from transaction hashes
     * @param {Array} transactions - Array of transaction hashes
     * @returns {MerkleTree} Constructed Merkle tree
     */
    buildMerkleTree(transactions) {
        if (transactions.length === 0) {
            // Create a tree with a single "empty" leaf if no transactions
            const emptyLeaf = keccak256('NO_TRANSACTIONS_' + Date.now());
            return new MerkleTree([emptyLeaf], keccak256, { sortPairs: true });
        }
        
        const leaves = transactions.map(tx => keccak256(tx));
        return new MerkleTree(leaves, keccak256, { sortPairs: true });
    }

    /**
     * Store batch data with Merkle proofs in database
     * @param {number} batchId - Batch identifier
     * @param {string} merkleRoot - Merkle root hash
     * @param {Array} transactions - Array of transaction hashes
     * @param {MerkleTree} tree - Constructed Merkle tree
     * @param {Object} anchorResult - Result from anchoring to Sepolia
     * @param {number} startBlock - Starting Besu block number
     * @param {number} endBlock - Ending Besu block number
     */
    async storeBatchData(batchId, merkleRoot, transactions, tree, anchorResult, startBlock, endBlock) {
        try {
            // Store batch information
            const { error: batchError } = await this.supabase
                .from('anchoring_batches')
                .upsert({
                    batch_id: batchId,
                    merkle_root: merkleRoot,
                    transaction_count: transactions.length,
                    anchored_at: new Date().toISOString(),
                    sepolia_tx_hash: anchorResult.transactionHash,
                    sepolia_block_number: anchorResult.blockNumber,
                    besu_start_block: startBlock,
                    besu_end_block: endBlock
                });
            
            if (batchError) {
                console.error('Error storing batch:', batchError);
                throw batchError;
            }

            // Store individual transactions with proofs
            const transactionData = [];
            for (let i = 0; i < transactions.length; i++) {
                const txHash = transactions[i];
                const leaf = keccak256(txHash);
                const proof = tree.getProof(leaf);
                
                const proofData = proof.map(p => ({
                    position: p.position === 'right' ? 'right' : 'left',
                    data: '0x' + p.data.toString('hex')
                }));
                
                transactionData.push({
                    batch_id: batchId,
                    transaction_hash: txHash,
                    besu_block_number: 0, // We'll need to get actual block numbers later
                    transaction_index: i,
                    merkle_proof: proofData,
                    leaf_index: i
                });
            }
            
            const { error: txError } = await this.supabase
                .from('batch_transactions')
                .upsert(transactionData);
            
            if (txError) {
                console.error('Error storing transactions:', txError);
                throw txError;
            }
            
            console.log(`✅ Stored batch ${batchId} with ${transactions.length} transactions`);
            
        } catch (error) {
            console.error('❌ Error storing batch data:', error);
            throw error;
        }
    }

    /**
     * Get anchoring statistics
     * @returns {Object} Statistics about anchored batches and transactions
     */
    async getAnchoringStats() {
        try {
            // Get batch count and latest batch
            const { data: batches, error: batchError } = await this.supabase
                .from('anchoring_batches')
                .select('*')
                .order('batch_id', { ascending: false });
            
            if (batchError) {
                console.error('Error getting batches:', batchError);
                throw batchError;
            }
            
            // Get transaction count
            const { count: transactionCount, error: txError } = await this.supabase
                .from('batch_transactions')
                .select('*', { count: 'exact', head: true });
            
            if (txError) {
                console.error('Error getting transaction count:', txError);
                throw txError;
            }
            
            const latestBatch = batches && batches.length > 0 ? batches[0] : null;
            
            return {
                totalBatches: batches ? batches.length : 0,
                totalTransactions: transactionCount || 0,
                lastAnchoredAt: latestBatch ? latestBatch.anchored_at : null,
                latestBatch: latestBatch,
                sepoliaContract: process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS
            };
        } catch (error) {
            console.error('❌ Error getting anchoring stats:', error);
            throw error;
        }
    }

    /**
     * Get batch details by batch ID
     * @param {number} batchId - Batch ID to retrieve
     * @returns {Object} Batch details with transactions
     */
    async getBatchDetails(batchId) {
        try {
            // Get batch information
            const { data: batch, error: batchError } = await this.supabase
                .from('anchoring_batches')
                .select('*')
                .eq('batch_id', batchId)
                .single();
            
            if (batchError || !batch) {
                console.error('Error getting batch:', batchError);
                return null;
            }
            
            // Get transactions for this batch
            const { data: transactions, error: txError } = await this.supabase
                .from('batch_transactions')
                .select('transaction_hash, besu_block_number, transaction_index, leaf_index')
                .eq('batch_id', batchId)
                .order('transaction_index', { ascending: true });
            
            if (txError) {
                console.error('Error getting transactions:', txError);
                throw txError;
            }
            
            return {
                batch: batch,
                transactions: transactions || [],
                etherscanUrl: `https://sepolia.etherscan.io/tx/${batch.sepolia_tx_hash}`
            };
        } catch (error) {
            console.error('❌ Error getting batch details:', error);
            throw error;
        }
    }

    /**
     * Update anchoring service status
     * @param {string} serviceName - Name of the service
     * @param {Object} status - Status update object
     */
    async updateServiceStatus(serviceName, status) {
        try {
            const updateData = {
                service_name: serviceName,
                updated_at: new Date().toISOString()
            };
            
            if (status.lastRunAt) updateData.last_run_at = status.lastRunAt;
            if (status.lastSuccessAt) updateData.last_success_at = status.lastSuccessAt;
            if (status.lastErrorAt) updateData.last_error_at = status.lastErrorAt;
            if (status.lastErrorMessage) updateData.last_error_message = status.lastErrorMessage;
            if (status.nextScheduledRun) updateData.next_scheduled_run = status.nextScheduledRun;
            
            const { error } = await this.supabase
                .from('anchoring_status')
                .upsert(updateData);
            
            if (error) {
                console.error('Error updating service status:', error);
                throw error;
            }
        } catch (error) {
            console.error('❌ Error updating service status:', error);
            throw error;
        }
    }

    /**
     * Get anchoring service status
     * @param {string} serviceName - Name of the service
     * @returns {Object} Service status information
     */
    async getServiceStatus(serviceName = 'daily_anchoring') {
        try {
            const { data, error } = await this.supabase
                .from('anchoring_status')
                .select('*')
                .eq('service_name', serviceName)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Error getting service status:', error);
                throw error;
            }
            
            return data || null;
        } catch (error) {
            console.error('❌ Error getting service status:', error);
            throw error;
        }
    }
}

module.exports = MerkleProofService;

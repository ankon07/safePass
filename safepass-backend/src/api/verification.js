const express = require('express');
const { ethers } = require('ethers');
const MerkleProofService = require('../services/merkleProofService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const merkleProofService = new MerkleProofService();

// Setup Sepolia provider for public verification
const sepoliaProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
const AnchorArtifact = require('../../artifacts/contracts/Anchor.sol/Anchor.json');

/**
 * Helper function to verify against Sepolia contract
 */
async function verifyAgainstSepolia(batchId, expectedRoot) {
    try {
        if (!process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS) {
            return { verified: false, error: 'Sepolia contract address not configured' };
        }

        const anchorContract = new ethers.Contract(
            process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS,
            AnchorArtifact.abi,
            sepoliaProvider
        );

        const actualRoot = await anchorContract.getMerkleRoot(batchId);
        const exists = await anchorContract.batchExists(batchId);

        return {
            verified: exists && actualRoot === expectedRoot,
            actualRoot: actualRoot,
            exists: exists,
            contractAddress: process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS
        };
    } catch (error) {
        console.error('Error verifying against Sepolia:', error);
        return { verified: false, error: error.message };
    }
}

/**
 * Generate Merkle proof for a transaction (Public endpoint)
 * GET /api/verification/proof/:transactionHash
 */
router.get('/proof/:transactionHash', async (req, res) => {
    try {
        const { transactionHash } = req.params;
        
        if (!transactionHash || !transactionHash.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction hash format. Must start with 0x'
            });
        }

        console.log(`🔍 Generating proof for transaction: ${transactionHash}`);
        
        const proof = await merkleProofService.generateProof(transactionHash);
        
        res.json({
            success: true,
            data: proof,
            message: 'Merkle proof generated successfully'
        });
    } catch (error) {
        console.error('Error generating proof:', error);
        
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: error.message,
                suggestion: 'Transaction may not have been anchored yet. Anchoring happens daily at 2 AM UTC.'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to generate proof',
                details: error.message
            });
        }
    }
});

/**
 * Verify a Merkle proof (Public endpoint)
 * POST /api/verification/verify
 */
router.post('/verify', async (req, res) => {
    try {
        const { transactionHash, proof, merkleRoot, batchId } = req.body;
        
        // Validate input
        if (!transactionHash || !proof || !merkleRoot || !batchId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: transactionHash, proof, merkleRoot, batchId'
            });
        }

        console.log(`🔍 Verifying proof for transaction: ${transactionHash} in batch ${batchId}`);
        
        // Local verification using Merkle proof
        const localVerification = merkleProofService.verifyProof(transactionHash, proof, merkleRoot);
        
        // Verify against Sepolia contract
        const sepoliaVerification = await verifyAgainstSepolia(batchId, merkleRoot);
        
        const isFullyVerified = localVerification && sepoliaVerification.verified;
        
        res.json({
            success: true,
            verified: isFullyVerified,
            verification: {
                local: localVerification,
                sepolia: sepoliaVerification.verified,
                sepoliaDetails: sepoliaVerification
            },
            transactionHash,
            batchId,
            merkleRoot,
            verifiedAt: new Date().toISOString(),
            etherscanUrl: sepoliaVerification.contractAddress ? 
                `https://sepolia.etherscan.io/address/${sepoliaVerification.contractAddress}` : null
        });
    } catch (error) {
        console.error('Error verifying proof:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify proof',
            details: error.message
        });
    }
});

/**
 * Get anchoring status and statistics (Public endpoint)
 * GET /api/verification/status
 */
router.get('/status', async (req, res) => {
    try {
        const stats = await merkleProofService.getAnchoringStats();
        const serviceStatus = await merkleProofService.getServiceStatus('daily_anchoring');
        
        res.json({
            success: true,
            status: {
                ...stats,
                serviceStatus: serviceStatus,
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting anchoring status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get anchoring status',
            details: error.message
        });
    }
});

/**
 * Get batch details by batch ID (Public endpoint)
 * GET /api/verification/batch/:batchId
 */
router.get('/batch/:batchId', async (req, res) => {
    try {
        const { batchId } = req.params;
        
        if (!batchId || isNaN(parseInt(batchId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid batch ID. Must be a number.'
            });
        }

        const batchDetails = await merkleProofService.getBatchDetails(parseInt(batchId));
        
        if (!batchDetails) {
            return res.status(404).json({
                success: false,
                error: 'Batch not found'
            });
        }
        
        res.json({
            success: true,
            data: batchDetails
        });
    } catch (error) {
        console.error('Error getting batch details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get batch details',
            details: error.message
        });
    }
});

/**
 * Get all batches with pagination (Public endpoint)
 * GET /api/verification/batches
 */
router.get('/batches', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
        const offset = (page - 1) * limit;
        
        const batchesQuery = `
            SELECT 
                batch_id, 
                merkle_root, 
                transaction_count, 
                anchored_at, 
                sepolia_tx_hash,
                sepolia_block_number
            FROM anchoring_batches 
            ORDER BY batch_id DESC 
            LIMIT $1 OFFSET $2
        `;
        
        const countQuery = `SELECT COUNT(*) FROM anchoring_batches`;
        
        const [batchesResult, countResult] = await Promise.all([
            merkleProofService.pool.query(batchesQuery, [limit, offset]),
            merkleProofService.pool.query(countQuery)
        ]);
        
        const totalBatches = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalBatches / limit);
        
        res.json({
            success: true,
            data: {
                batches: batchesResult.rows,
                pagination: {
                    page,
                    limit,
                    totalBatches,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error getting batches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get batches',
            details: error.message
        });
    }
});

/**
 * Search for transactions by hash pattern (Public endpoint)
 * GET /api/verification/search
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;
        
        if (!query || query.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Query must be at least 6 characters long'
            });
        }
        
        const searchQuery = `
            SELECT 
                bt.transaction_hash,
                bt.batch_id,
                ab.merkle_root,
                ab.anchored_at,
                ab.sepolia_tx_hash
            FROM batch_transactions bt
            JOIN anchoring_batches ab ON bt.batch_id = ab.batch_id
            WHERE bt.transaction_hash ILIKE $1
            ORDER BY ab.anchored_at DESC
            LIMIT $2
        `;
        
        const result = await merkleProofService.pool.query(searchQuery, [`%${query}%`, Math.min(parseInt(limit), 50)]);
        
        res.json({
            success: true,
            data: {
                query,
                results: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error searching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search transactions',
            details: error.message
        });
    }
});

/**
 * Get public verification statistics (Public endpoint)
 * GET /api/verification/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT ab.batch_id) as total_batches,
                COUNT(bt.id) as total_transactions,
                MIN(ab.anchored_at) as first_anchor_date,
                MAX(ab.anchored_at) as last_anchor_date,
                AVG(ab.transaction_count) as avg_transactions_per_batch,
                MAX(ab.transaction_count) as max_transactions_per_batch
            FROM anchoring_batches ab
            LEFT JOIN batch_transactions bt ON ab.batch_id = bt.batch_id
        `;
        
        const result = await merkleProofService.pool.query(statsQuery);
        const stats = result.rows[0];
        
        // Get recent activity (last 7 days)
        const recentQuery = `
            SELECT 
                DATE(anchored_at) as date,
                COUNT(*) as batches,
                SUM(transaction_count) as transactions
            FROM anchoring_batches 
            WHERE anchored_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(anchored_at)
            ORDER BY date DESC
        `;
        
        const recentResult = await merkleProofService.pool.query(recentQuery);
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalBatches: parseInt(stats.total_batches) || 0,
                    totalTransactions: parseInt(stats.total_transactions) || 0,
                    firstAnchorDate: stats.first_anchor_date,
                    lastAnchorDate: stats.last_anchor_date,
                    avgTransactionsPerBatch: parseFloat(stats.avg_transactions_per_batch) || 0,
                    maxTransactionsPerBatch: parseInt(stats.max_transactions_per_batch) || 0
                },
                recentActivity: recentResult.rows,
                sepoliaContract: process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting verification stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get verification statistics',
            details: error.message
        });
    }
});

/**
 * Trigger manual anchoring (Admin only)
 * POST /api/verification/anchor/trigger
 */
router.post('/anchor/trigger', authenticateToken, async (req, res) => {
    try {
        // Check if user is Regulator
        if (req.user?.role !== 'Regulator') {
            return res.status(403).json({
                success: false,
                error: 'Only regulators can trigger manual anchoring'
            });
        }

        // Import and run the enhanced anchor service
        const EnhancedAnchorService = require('../../scripts/enhancedAnchorService');
        const anchorService = new EnhancedAnchorService();
        
        // Run anchoring in background
        anchorService.performAnchoring()
            .then(() => {
                console.log('✅ Manual anchoring completed successfully');
            })
            .catch((error) => {
                console.error('❌ Manual anchoring failed:', error);
            });
        
        res.json({
            success: true,
            message: 'Manual anchoring triggered successfully',
            triggeredBy: req.user.email,
            triggeredAt: new Date().toISOString(),
            note: 'Anchoring is running in the background. Check status endpoint for progress.'
        });
    } catch (error) {
        console.error('Error triggering manual anchoring:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger manual anchoring',
            details: error.message
        });
    }
});

/**
 * Get anchoring service health (Admin only)
 * GET /api/verification/anchor/health
 */
router.get('/anchor/health', authenticateToken, async (req, res) => {
    try {
        // Check if user is Regulator or AgencyAdmin
        if (req.user?.role !== 'Regulator' && req.user?.role !== 'AgencyAdmin') {
            return res.status(403).json({
                success: false,
                error: 'Only regulators and agency administrators can view anchoring health'
            });
        }

        const EnhancedAnchorService = require('../../scripts/enhancedAnchorService');
        const anchorService = new EnhancedAnchorService();
        
        const healthStatus = await anchorService.getHealthStatus();
        
        res.json({
            success: true,
            data: healthStatus
        });
    } catch (error) {
        console.error('Error getting anchoring health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get anchoring health status',
            details: error.message
        });
    }
});

/**
 * Validate transaction format (Utility endpoint)
 * GET /api/verification/validate/:transactionHash
 */
router.get('/validate/:transactionHash', (req, res) => {
    try {
        const { transactionHash } = req.params;
        
        const isValid = transactionHash && 
                       transactionHash.startsWith('0x') && 
                       transactionHash.length === 66 &&
                       /^0x[a-fA-F0-9]{64}$/.test(transactionHash);
        
        res.json({
            success: true,
            data: {
                transactionHash,
                isValid,
                format: isValid ? 'valid' : 'invalid',
                requirements: {
                    startsWithOx: transactionHash?.startsWith('0x') || false,
                    correctLength: transactionHash?.length === 66 || false,
                    hexadecimal: /^0x[a-fA-F0-9]{64}$/.test(transactionHash || '') || false
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to validate transaction hash',
            details: error.message
        });
    }
});

module.exports = router;

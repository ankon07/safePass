const { ethers } = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const cron = require('node-cron');
const MerkleProofService = require('../src/services/merkleProofService');
require('dotenv/config');

// Import the ABI of the Anchor contract
const AnchorArtifact = require('../artifacts/contracts/Anchor.sol/Anchor.json');

class EnhancedAnchorService {
    constructor() {
        this.merkleProofService = new MerkleProofService();
        this.setupConfiguration();
        this.setupProviders();
        this.isRunning = false;
        this.scheduledJob = null;
    }

    setupConfiguration() {
        // Configuration with validation
        this.config = {
            BESU_RPC_URL: process.env.BESU_RPC_URL || 'http://localhost:8545',
            SEPOLIA_RPC_URL: process.env.ETHEREUM_SEPOLIA_RPC_URL,
            ANCHORING_PRIVATE_KEY: process.env.ANCHORING_SERVICE_PRIVATE_KEY,
            SEPOLIA_ANCHOR_ADDRESS: process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS,
            LAST_ANCHORED_BLOCK_FILE: process.env.LAST_ANCHORED_BLOCK_FILE || './data/last-anchored-block.json',
            BATCH_SIZE: parseInt(process.env.ANCHOR_BATCH_SIZE) || 1000,
            SCHEDULE: process.env.ANCHOR_SCHEDULE || '0 2 * * *' // 2 AM daily
        };

        // Validation
        if (!this.config.SEPOLIA_RPC_URL) {
            throw new Error('❌ ETHEREUM_SEPOLIA_RPC_URL not set in .env file');
        }
        if (!this.config.ANCHORING_PRIVATE_KEY) {
            throw new Error('❌ ANCHORING_SERVICE_PRIVATE_KEY not set in .env file');
        }
        if (!this.config.SEPOLIA_ANCHOR_ADDRESS) {
            throw new Error('❌ SEPOLIA_ANCHOR_CONTRACT_ADDRESS not set in .env file');
        }
    }

    setupProviders() {
        // Setup blockchain providers
        this.besuProvider = new ethers.JsonRpcProvider(this.config.BESU_RPC_URL);
        this.sepoliaProvider = new ethers.JsonRpcProvider(this.config.SEPOLIA_RPC_URL);
        this.anchoringWallet = new ethers.Wallet(this.config.ANCHORING_PRIVATE_KEY, this.sepoliaProvider);
        this.anchorContract = new ethers.Contract(
            this.config.SEPOLIA_ANCHOR_ADDRESS, 
            AnchorArtifact.abi, 
            this.anchoringWallet
        );
    }

    /**
     * Load the last anchored block from file or database
     */
    async loadLastAnchoredBlock() {
        try {
            // Try to get from database first
            const status = await this.merkleProofService.getServiceStatus('daily_anchoring');
            if (status && status.configuration && status.configuration.lastAnchoredBlock) {
                return status.configuration.lastAnchoredBlock;
            }

            // Fallback to file
            if (existsSync(this.config.LAST_ANCHORED_BLOCK_FILE)) {
                const data = JSON.parse(readFileSync(this.config.LAST_ANCHORED_BLOCK_FILE, 'utf8'));
                return data.lastAnchoredBlock || 0;
            }
        } catch (error) {
            console.warn('⚠️  Could not load last anchored block, starting from block 0');
        }
        return 0;
    }

    /**
     * Save the last anchored block to file and database
     */
    async saveLastAnchoredBlock(blockNumber, batchId, merkleRoot) {
        const data = {
            lastAnchoredBlock: blockNumber,
            lastAnchoredAt: new Date().toISOString(),
            lastBatchId: batchId,
            lastMerkleRoot: merkleRoot,
            sepoliaContract: this.config.SEPOLIA_ANCHOR_ADDRESS
        };

        try {
            // Save to file
            writeFileSync(this.config.LAST_ANCHORED_BLOCK_FILE, JSON.stringify(data, null, 2));
            console.log(`💾 Saved anchoring state to ${this.config.LAST_ANCHORED_BLOCK_FILE}`);

            // Save to database
            await this.merkleProofService.updateServiceStatus('daily_anchoring', {
                lastSuccessAt: new Date(),
                nextScheduledRun: this.getNextScheduledRun()
            });

            // Update configuration in database
            const currentStatus = await this.merkleProofService.getServiceStatus('daily_anchoring');
            if (currentStatus) {
                const updatedConfig = {
                    ...currentStatus.configuration,
                    lastAnchoredBlock: blockNumber,
                    lastBatchId: batchId,
                    lastMerkleRoot: merkleRoot
                };
                
                await this.merkleProofService.pool.query(
                    'UPDATE anchoring_status SET configuration = $1 WHERE service_name = $2',
                    [JSON.stringify(updatedConfig), 'daily_anchoring']
                );
            }
        } catch (error) {
            console.error('❌ Failed to save anchoring state:', error.message);
        }
    }

    /**
     * Get new transactions from Besu since the last anchored block
     */
    async getBesuTransactionsSince(startBlock) {
        console.log(`🔍 Fetching transactions from Besu blocks ${startBlock} onwards...`);

        const latestBlockNumber = await this.besuProvider.getBlockNumber();
        console.log(`📊 Latest Besu block: ${latestBlockNumber}`);

        if (startBlock >= latestBlockNumber) {
            console.log('ℹ️  No new blocks to process');
            return { transactions: [], latestBlock: latestBlockNumber, startBlock, endBlock: latestBlockNumber };
        }

        const transactionHashes = [];
        let processedBlocks = 0;

        // Process blocks in batches to avoid overwhelming the RPC
        const BATCH_SIZE = 10;

        for (let i = startBlock + 1; i <= latestBlockNumber; i += BATCH_SIZE) {
            const endBlock = Math.min(i + BATCH_SIZE - 1, latestBlockNumber);

            console.log(`📦 Processing blocks ${i} to ${endBlock}...`);

            const blockPromises = [];
            for (let blockNum = i; blockNum <= endBlock; blockNum++) {
                blockPromises.push(this.besuProvider.getBlock(blockNum, true)); // Include transactions
            }

            const blocks = await Promise.all(blockPromises);

            for (const block of blocks) {
                if (block && block.transactions && block.transactions.length > 0) {
                    // Get transaction hashes
                    const txHashes = block.transactions.map(tx => 
                        typeof tx === 'string' ? tx : tx.hash
                    );
                    transactionHashes.push(...txHashes);
                    processedBlocks++;
                }
            }

            // Limit batch size to prevent memory issues
            if (transactionHashes.length >= this.config.BATCH_SIZE) {
                console.log(`⚠️  Reached batch size limit of ${this.config.BATCH_SIZE} transactions`);
                break;
            }
        }

        console.log(`✅ Processed ${processedBlocks} blocks with transactions`);
        console.log(`📝 Found ${transactionHashes.length} transactions to anchor`);

        return { 
            transactions: transactionHashes, 
            latestBlock: latestBlockNumber,
            startBlock: startBlock + 1,
            endBlock: latestBlockNumber
        };
    }

    /**
     * Create Merkle tree from transaction hashes
     */
    createMerkleTree(transactionHashes) {
        return this.merkleProofService.buildMerkleTree(transactionHashes);
    }

    /**
     * Anchor Merkle root to Sepolia blockchain
     */
    async anchorToSepolia(merkleRoot) {
        console.log(`🚀 Anchoring Merkle root to Sepolia: ${merkleRoot}`);

        try {
            // Check wallet balance
            const balance = await this.sepoliaProvider.getBalance(this.anchoringWallet.address);
            console.log(`💰 Anchoring wallet balance: ${ethers.formatEther(balance)} ETH`);

            if (balance < ethers.parseEther('0.001')) {
                throw new Error('Insufficient balance for anchoring transaction. Please fund the anchoring wallet.');
            }

            // Estimate gas
            const gasEstimate = await this.anchorContract.anchorNewBatch.estimateGas(merkleRoot);
            console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

            // Send transaction
            const tx = await this.anchorContract.anchorNewBatch(merkleRoot, {
                gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
            });

            console.log(`📤 Transaction sent: ${tx.hash}`);
            console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

            // Wait for confirmation
            console.log('⏳ Waiting for transaction confirmation...');
            const receipt = await tx.wait();

            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);

            // Extract batch ID from event logs
            let batchId = null;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.anchorContract.interface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'BatchAnchored') {
                        batchId = parsedLog.args[0].toString();
                        break;
                    }
                } catch (e) {
                    // Skip logs that don't match our contract
                }
            }

            return {
                success: true,
                transactionHash: receipt.hash || receipt.transactionHash || tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                batchId: batchId
            };

        } catch (error) {
            console.error('❌ Failed to anchor Merkle root:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Main anchoring process with enhanced features
     */
    async performAnchoring() {
        if (this.isRunning) {
            console.log('⚠️  Anchoring already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date();

        try {
            console.log('🌟 Starting Enhanced SafePass Anchoring Service');
            console.log('='.repeat(60));
            console.log(`📅 Timestamp: ${startTime.toISOString()}`);
            console.log(`🔗 Besu RPC: ${this.config.BESU_RPC_URL}`);
            console.log(`🔗 Sepolia RPC: ${this.config.SEPOLIA_RPC_URL}`);
            console.log(`📍 Anchor Contract: ${this.config.SEPOLIA_ANCHOR_ADDRESS}`);
            console.log(`👛 Anchoring Wallet: ${this.anchoringWallet.address}`);
            console.log('='.repeat(60));

            // Update service status - started
            await this.merkleProofService.updateServiceStatus('daily_anchoring', {
                lastRunAt: startTime
            });

            // 1. Load the last anchored block
            const lastAnchoredBlock = await this.loadLastAnchoredBlock();
            console.log(`📖 Last anchored block: ${lastAnchoredBlock}`);

            // 2. Fetch new transactions from Besu
            const { transactions, latestBlock, startBlock, endBlock } = await this.getBesuTransactionsSince(lastAnchoredBlock);

            if (transactions.length === 0) {
                console.log('ℹ️  No new transactions to anchor. Exiting.');
                await this.merkleProofService.updateServiceStatus('daily_anchoring', {
                    lastSuccessAt: new Date(),
                    nextScheduledRun: this.getNextScheduledRun()
                });
                return;
            }

            // 3. Build the Merkle Tree
            console.log('🌳 Building Merkle tree...');
            const tree = this.createMerkleTree(transactions);
            const merkleRoot = tree.getHexRoot();

            console.log(`🔐 Merkle Root: ${merkleRoot}`);
            console.log(`🍃 Tree depth: ${tree.getDepth()}`);
            console.log(`📊 Leaf count: ${tree.getLeafCount()}`);

            // 4. Anchor to Sepolia
            const anchorResult = await this.anchorToSepolia(merkleRoot);

            if (anchorResult.success) {
                // 5. Store batch data with proofs in database
                await this.merkleProofService.storeBatchData(
                    anchorResult.batchId,
                    merkleRoot,
                    transactions,
                    tree,
                    anchorResult,
                    startBlock,
                    endBlock
                );

                // 6. Save the anchoring state
                await this.saveLastAnchoredBlock(latestBlock, anchorResult.batchId, merkleRoot);

                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;

                console.log('\n🎉 Anchoring completed successfully!');
                console.log('='.repeat(60));
                console.log(`📦 Transactions anchored: ${transactions.length}`);
                console.log(`🔐 Merkle Root: ${merkleRoot}`);
                console.log(`🆔 Batch ID: ${anchorResult.batchId}`);
                console.log(`📋 Transaction: ${anchorResult.transactionHash}`);
                console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${anchorResult.transactionHash}`);
                console.log(`⛽ Gas Used: ${anchorResult.gasUsed}`);
                console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
                console.log(`📊 Blocks processed: ${startBlock} to ${endBlock}`);
                console.log('='.repeat(60));

                // Update service status - success
                await this.merkleProofService.updateServiceStatus('daily_anchoring', {
                    lastSuccessAt: endTime,
                    nextScheduledRun: this.getNextScheduledRun()
                });

            } else {
                throw new Error(`Anchoring failed: ${anchorResult.error}`);
            }

        } catch (error) {
            console.error('\n💥 Anchoring failed!');
            console.error(`Error: ${error.message}`);
            console.error('Stack:', error.stack);

            // Update service status - error
            await this.merkleProofService.updateServiceStatus('daily_anchoring', {
                lastErrorAt: new Date(),
                lastErrorMessage: error.message,
                nextScheduledRun: this.getNextScheduledRun()
            });

            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Calculate next scheduled run time
     */
    getNextScheduledRun() {
        // For daily at 2 AM, calculate next occurrence
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 2 AM
        return tomorrow;
    }

    /**
     * Start the automatic 24-hour scheduler
     */
    startScheduler() {
        console.log('⏰ Starting Enhanced Anchoring Scheduler...');
        console.log(`📅 Schedule: ${this.config.SCHEDULE} (${this.config.SCHEDULE === '0 2 * * *' ? 'Daily at 2 AM UTC' : 'Custom schedule'})`);

        // Validate cron expression
        if (!cron.validate(this.config.SCHEDULE)) {
            throw new Error(`Invalid cron schedule: ${this.config.SCHEDULE}`);
        }

        // Schedule the job
        this.scheduledJob = cron.schedule(this.config.SCHEDULE, async () => {
            console.log('🕐 Scheduled anchoring triggered at', new Date().toISOString());
            try {
                await this.performAnchoring();
            } catch (error) {
                console.error('❌ Scheduled anchoring failed:', error);
                await this.sendErrorNotification(error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        // Health check every hour
        cron.schedule('0 * * * *', async () => {
            console.log('💓 Scheduler health check:', new Date().toISOString());
            const status = await this.merkleProofService.getServiceStatus('daily_anchoring');
            if (status) {
                console.log(`📊 Last success: ${status.last_success_at || 'Never'}`);
                console.log(`📊 Next run: ${status.next_scheduled_run || 'Not scheduled'}`);
            }
        });

        console.log('✅ Enhanced scheduler started successfully');
        console.log(`🔄 Next run scheduled for: ${this.getNextScheduledRun().toISOString()}`);

        // Run immediately on startup if needed (optional)
        if (process.env.RUN_ON_STARTUP === 'true') {
            console.log('🚀 Running initial anchoring on startup...');
            setTimeout(() => {
                this.performAnchoring().catch(console.error);
            }, 5000); // Wait 5 seconds for system to stabilize
        }
    }

    /**
     * Stop the scheduler
     */
    stopScheduler() {
        if (this.scheduledJob) {
            this.scheduledJob.destroy();
            console.log('🛑 Scheduler stopped');
        }
    }

    /**
     * Send error notification (can be extended with email, Slack, etc.)
     */
    async sendErrorNotification(error) {
        console.error('📧 Error notification:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            service: 'SafePass Anchoring Service'
        });

        // TODO: Implement actual notification system
        // - Email notifications
        // - Slack/Discord webhooks
        // - SMS alerts
        // - Monitoring system integration
    }

    /**
     * Get service health status
     */
    async getHealthStatus() {
        try {
            const status = await this.merkleProofService.getServiceStatus('daily_anchoring');
            const stats = await this.merkleProofService.getAnchoringStats();
            
            // Check Besu connectivity
            let besuConnected = false;
            try {
                await this.besuProvider.getBlockNumber();
                besuConnected = true;
            } catch (e) {
                console.warn('Besu connection issue:', e.message);
            }

            // Check Sepolia connectivity
            let sepoliaConnected = false;
            try {
                await this.sepoliaProvider.getBlockNumber();
                sepoliaConnected = true;
            } catch (e) {
                console.warn('Sepolia connection issue:', e.message);
            }

            return {
                service: 'SafePass Enhanced Anchoring Service',
                status: status,
                statistics: stats,
                connectivity: {
                    besu: besuConnected,
                    sepolia: sepoliaConnected
                },
                configuration: this.config,
                isRunning: this.isRunning,
                schedulerActive: this.scheduledJob ? true : false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                service: 'SafePass Enhanced Anchoring Service',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = EnhancedAnchorService;

// CLI interface
if (require.main === module) {
    async function main() {
        const service = new EnhancedAnchorService();
        const command = process.argv[2];

        switch (command) {
            case 'start':
                service.startScheduler();
                console.log('Scheduler started. Press Ctrl+C to stop.');
                process.on('SIGINT', () => {
                    console.log('\n🛑 Shutting down scheduler...');
                    service.stopScheduler();
                    process.exit(0);
                });
                break;

            case 'run':
                await service.performAnchoring();
                break;

            case 'status':
                const status = await service.getHealthStatus();
                console.log(JSON.stringify(status, null, 2));
                break;

            case 'test':
                console.log('🧪 Testing service configuration...');
                const health = await service.getHealthStatus();
                console.log('Configuration test:', health.connectivity);
                break;

            default:
                console.log(`
Enhanced SafePass Anchoring Service

Usage: node scripts/enhancedAnchorService.js <command>

Commands:
  start    Start the 24-hour scheduler
  run      Run anchoring once immediately
  status   Get service health status
  test     Test service configuration

Environment Variables:
  ETHEREUM_SEPOLIA_RPC_URL        Sepolia RPC endpoint
  ANCHORING_SERVICE_PRIVATE_KEY   Private key for anchoring wallet
  SEPOLIA_ANCHOR_CONTRACT_ADDRESS Deployed Anchor contract address
  BESU_RPC_URL                    Besu RPC endpoint (default: http://localhost:8545)
  ANCHOR_SCHEDULE                 Cron schedule (default: 0 2 * * * - daily at 2 AM)
  ANCHOR_BATCH_SIZE               Max transactions per batch (default: 1000)
  RUN_ON_STARTUP                  Run immediately on startup (default: false)

Examples:
  node scripts/enhancedAnchorService.js start
  node scripts/enhancedAnchorService.js run
  node scripts/enhancedAnchorService.js status
                `);
        }
    }

    main().catch(console.error);
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blockchainService_1 = require("../services/blockchain/blockchainService");
const auth_1 = require("../middleware/auth");

const router = express_1.default.Router();

// Middleware to ensure blockchain service is ready
const ensureBlockchainReady = (req, res, next) => {
    try {
        // Check if we have at least one contract registered
        if (!process.env.EMPLOYMENT_CONTRACT_ADDRESS && !process.env.DID_REGISTRY_ADDRESS) {
            return res.status(503).json({
                error: 'Blockchain service not ready - no contracts configured'
            });
        }
        next();
    }
    catch (error) {
        res.status(503).json({
            error: 'Blockchain service not available',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Get blockchain service status
 */
router.get('/status', async (req, res) => {
    try {
        const balance = await blockchainService_1.blockchainService.getBalance();
        const blockNumber = await blockchainService_1.blockchainService.getCurrentBlockNumber();
        res.json({
            status: 'connected',
            walletAddress: blockchainService_1.blockchainService['wallet'].address,
            balance: `${balance} ETH`,
            currentBlock: blockNumber,
            registeredContracts: Array.from(blockchainService_1.blockchainService['contracts'].keys())
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * FIXED: Test credential operations using regulator functions
 * This replaces the problematic signContract call
 */
router.post('/credentials/issue', ensureBlockchainReady, async (req, res) => {
    try {
        const { action = 'updateCredentialStatus', credentialId = 'test_credential_001', status = 'active' } = req.body;
        
        console.log(`Attempting to ${action} for credential ${credentialId} with status ${status}`);
        
        // Use updateCredentialStatus instead of signContract (regulator can call this)
        const tx = await blockchainService_1.blockchainService.executeContractMethod(
            'EmploymentContract', 
            'updateCredentialStatus', 
            [credentialId, status]
        );
        
        res.json({
            success: true,
            transactionHash: tx.hash,
            action: 'updateCredentialStatus',
            credentialId,
            status,
            message: 'Credential status updated successfully on blockchain'
        });
    }
    catch (error) {
        console.error('Error updating credential status:', error);
        res.status(500).json({
            error: 'Failed to update credential status',
            details: error instanceof Error ? error.message : String(error),
            suggestion: 'Try using updateCredentialStatus instead of signContract'
        });
    }
});

/**
 * NEW: Get contract details (read-only)
 */
router.get('/contract/details', ensureBlockchainReady, async (req, res) => {
    try {
        const details = await blockchainService_1.blockchainService.callContractMethod(
            'EmploymentContract', 
            'getContractDetails', 
            []
        );
        
        res.json({
            success: true,
            contractDetails: {
                worker: details._worker,
                employer: details._employer,
                salary: details._salary.toString(),
                payFrequency: details._payFrequency.toString(),
                nextPaymentDueDate: details._nextPaymentDueDate.toString(),
                escrowRequirement: details._escrowRequirement.toString(),
                escrowDeposited: details._escrowDeposited,
                escrowContract: details._escrowContract,
                status: details._status.toString(),
                paymentStatus: details._paymentStatus.toString(),
                workerSigned: details._workerSigned,
                employerSigned: details._employerSigned
            }
        });
    }
    catch (error) {
        console.error('Error getting contract details:', error);
        res.status(500).json({
            error: 'Failed to get contract details',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * NEW: Test read-only methods
 */
router.get('/contract/test', ensureBlockchainReady, async (req, res) => {
    try {
        const paymentCount = await blockchainService_1.blockchainService.callContractMethod(
            'EmploymentContract', 
            'getPaymentCount', 
            []
        );
        
        const isReady = await blockchainService_1.blockchainService.callContractMethod(
            'EmploymentContract', 
            'isReadyForActivation', 
            []
        );
        
        res.json({
            success: true,
            testResults: {
                paymentCount: paymentCount.toString(),
                isReadyForActivation: isReady,
                message: 'Read-only methods working correctly'
            }
        });
    }
    catch (error) {
        console.error('Error testing contract methods:', error);
        res.status(500).json({
            error: 'Failed to test contract methods',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Update credential status (this works with regulator wallet)
 */
router.put('/credentials/:credentialId/status', auth_1.authenticateToken, ensureBlockchainReady, async (req, res) => {
    try {
        const { credentialId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                error: 'status is required'
            });
        }

        // Update credential status using blockchain service
        const tx = await blockchainService_1.blockchainService.executeContractMethod(
            'EmploymentContract', 
            'updateCredentialStatus', 
            [credentialId, status]
        );

        res.json({
            success: true,
            transactionHash: tx.hash,
            credentialId,
            newStatus: status,
            message: 'Credential status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating credential status:', error);
        res.status(500).json({
            error: 'Failed to update credential status',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Get credential information
 */
router.get('/credentials/:credentialId', ensureBlockchainReady, async (req, res) => {
    try {
        const { credentialId } = req.params;

        // Get credential info using blockchain service
        const credentialInfo = await blockchainService_1.blockchainService.callContractMethod(
            'EmploymentContract', 
            'getCredential', 
            [credentialId]
        );

        res.json({
            credentialId,
            status: credentialInfo[0], // credentialStatus
            issuer: credentialInfo[1]  // issuer address
        });
    }
    catch (error) {
        console.error('Error getting credential:', error);
        res.status(500).json({
            error: 'Failed to get credential',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Get credentials for a worker
 */
router.get('/workers/:workerDid/credentials', ensureBlockchainReady, async (req, res) => {
    try {
        const { workerDid } = req.params;

        // Get worker credentials using blockchain service
        const credentials = await blockchainService_1.blockchainService.callContractMethod(
            'EmploymentContract', 
            'getWorkerCredentials', 
            [workerDid]
        );

        res.json({
            workerDid,
            credentials
        });
    }
    catch (error) {
        console.error('Error getting worker credentials:', error);
        res.status(500).json({
            error: 'Failed to get worker credentials',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Helper function to convert BigInt values to strings for JSON serialization
 */
const convertBigIntToString = (obj) => {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    else if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    else if (obj !== null && typeof obj === 'object') {
        const converted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                converted[key] = convertBigIntToString(obj[key]);
            }
        }
        return converted;
    }
    return obj;
};

/**
 * Get past events from contracts
 */
router.get('/events/:contractName/:eventName', ensureBlockchainReady, async (req, res) => {
    try {
        const { contractName, eventName } = req.params;
        const { fromBlock = 0, toBlock = 'latest' } = req.query;

        const events = await blockchainService_1.blockchainService.getPastEvents(
            contractName, 
            eventName, 
            Number(fromBlock), 
            toBlock
        );

        res.json({
            contractName,
            eventName,
            fromBlock,
            toBlock,
            events: events.map(event => ({
                blockNumber: convertBigIntToString(event.blockNumber),
                transactionHash: event.transactionHash,
                args: convertBigIntToString(event.args),
                topics: event.topics
            }))
        });
    }
    catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            error: 'Failed to get events',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Register a new contract
 */
router.post('/contracts/register', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, address, abi } = req.body;

        if (!name || !address || !abi) {
            return res.status(400).json({
                error: 'name, address, and abi are required'
            });
        }

        blockchainService_1.blockchainService.registerContract(name, { address, abi });

        res.json({
            success: true,
            message: `Contract ${name} registered successfully`,
            address
        });
    }
    catch (error) {
        console.error('Error registering contract:', error);
        res.status(500).json({
            error: 'Failed to register contract',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Deploy a new contract
 */
router.post('/contracts/deploy', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, abi, bytecode, constructorArgs = [] } = req.body;

        if (!name || !abi || !bytecode) {
            return res.status(400).json({
                error: 'name, abi, and bytecode are required'
            });
        }

        const address = await blockchainService_1.blockchainService.deployContract(name, abi, bytecode, constructorArgs);

        res.json({
            success: true,
            message: `Contract ${name} deployed successfully`,
            address,
            constructorArgs
        });
    }
    catch (error) {
        console.error('Error deploying contract:', error);
        res.status(500).json({
            error: 'Failed to deploy contract',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

exports.default = router;

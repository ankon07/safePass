import express from 'express';
import { blockchainService } from '../services/blockchain/blockchainService';
import { authenticateToken } from '../middleware/auth';
import { cache, cacheInvalidation, CACHE_TTL } from '../middleware/cache';

const router = express.Router();

// Middleware to ensure blockchain service is ready
const ensureBlockchainReady = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Check if we have at least one contract registered
    if (!process.env.EMPLOYMENT_CONTRACT_ADDRESS && !process.env.DID_REGISTRY_ADDRESS) {
      return res.status(503).json({
        error: 'Blockchain service not ready - no contracts configured'
      });
    }
    next();
  } catch (error) {
    res.status(503).json({
      error: 'Blockchain service not available',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get blockchain service status
 */
router.get('/status', cache({ ttl: CACHE_TTL.SHORT_TERM }), async (req, res) => {
  try {
    const balance = await blockchainService.getBalance();
    const blockNumber = await blockchainService.getCurrentBlockNumber();
    
    res.json({
      status: 'connected',
      walletAddress: blockchainService['wallet'].address,
      balance: `${balance} ETH`,
      currentBlock: blockNumber,
      registeredContracts: Array.from(blockchainService['contracts'].keys())
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Sign employment contract (simulating credential issuance)
 */
router.post('/credentials/issue', ensureBlockchainReady, async (req, res) => {
  try {
    const { action = 'signContract' } = req.body;

    // For testing purposes, we'll use the signContract method
    // In a real implementation, you might have a separate credential contract
    const tx = await blockchainService.executeContractMethod(
      'EmploymentContract',
      'signContract',
      []
    );

    // Invalidate blockchain-related cache
    cacheInvalidation.clearAll();

    res.json({
      success: true,
      transactionHash: tx.hash,
      action,
      message: 'Contract signed successfully on blockchain'
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({
      error: 'Failed to sign contract',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Update credential status
 */
router.put('/credentials/:credentialId/status', authenticateToken, ensureBlockchainReady, async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'status is required'
      });
    }

    // Update credential status using blockchain service
    const tx = await blockchainService.executeContractMethod(
      'EmploymentContract',
      'updateCredentialStatus',
      [credentialId, status]
    );

    // Invalidate blockchain-related cache
    cacheInvalidation.clearAll();

    res.json({
      success: true,
      transactionHash: tx.hash,
      credentialId,
      newStatus: status,
      message: 'Credential status updated successfully'
    });

  } catch (error) {
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
router.get('/credentials/:credentialId', ensureBlockchainReady, cache({ 
  ttl: CACHE_TTL.LOOKUP_DATA,
  keyGenerator: (req) => `blockchain:credential:${req.params.credentialId}`
}), async (req, res) => {
  try {
    const { credentialId } = req.params;

    // Get credential info using blockchain service
    const credentialInfo = await blockchainService.callContractMethod(
      'EmploymentContract',
      'getCredential',
      [credentialId]
    );

    res.json({
      credentialId,
      ...credentialInfo
    });

  } catch (error) {
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
router.get('/workers/:workerDid/credentials', ensureBlockchainReady, cache({
  ttl: CACHE_TTL.LOOKUP_DATA,
  keyGenerator: (req) => `blockchain:worker:credentials:${req.params.workerDid}`
}), async (req, res) => {
  try {
    const { workerDid } = req.params;

    // Get worker credentials using blockchain service
    const credentials = await blockchainService.callContractMethod(
      'EmploymentContract',
      'getWorkerCredentials',
      [workerDid]
    );

    res.json({
      workerDid,
      credentials
    });

  } catch (error) {
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
const convertBigIntToString = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj !== null && typeof obj === 'object') {
    const converted: any = {};
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
router.get('/events/:contractName/:eventName', ensureBlockchainReady, cache({
  ttl: CACHE_TTL.SHORT_TERM,
  keyGenerator: (req) => `blockchain:events:${req.params.contractName}:${req.params.eventName}:${JSON.stringify(req.query)}`
}), async (req, res) => {
  try {
    const { contractName, eventName } = req.params;
    const { fromBlock = 0, toBlock = 'latest' } = req.query;

    const events = await blockchainService.getPastEvents(
      contractName,
      eventName,
      Number(fromBlock),
      toBlock as string
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

  } catch (error) {
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
router.post('/contracts/register', authenticateToken, async (req, res) => {
  try {
    const { name, address, abi } = req.body;

    if (!name || !address || !abi) {
      return res.status(400).json({
        error: 'name, address, and abi are required'
      });
    }

    blockchainService.registerContract(name, { address, abi });

    // Invalidate blockchain-related cache
    cacheInvalidation.clearAll();

    res.json({
      success: true,
      message: `Contract ${name} registered successfully`,
      address
    });

  } catch (error) {
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
router.post('/contracts/deploy', authenticateToken, async (req, res) => {
  try {
    const { name, abi, bytecode, constructorArgs = [] } = req.body;

    if (!name || !abi || !bytecode) {
      return res.status(400).json({
        error: 'name, abi, and bytecode are required'
      });
    }

    const address = await blockchainService.deployContract(name, abi, bytecode, constructorArgs);

    // Invalidate blockchain-related cache
    cacheInvalidation.clearAll();

    res.json({
      success: true,
      message: `Contract ${name} deployed successfully`,
      address,
      constructorArgs
    });

  } catch (error) {
    console.error('Error deploying contract:', error);
    res.status(500).json({
      error: 'Failed to deploy contract',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

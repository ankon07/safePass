const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

/**
 * Cross-Chain Bridge Service
 * Handles interactions between Hyperledger Besu (private) and public blockchains
 */
class CrossChainBridge {
  constructor(config = {}) {
    this.config = {
      batchSize: parseInt(process.env.BRIDGE_BATCH_SIZE) || 100,
      confirmationBlocks: parseInt(process.env.BRIDGE_CONFIRMATION_BLOCKS) || 12,
      retryAttempts: parseInt(process.env.BRIDGE_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.BRIDGE_RETRY_DELAY) || 5000,
      ...config
    };
    
    this.privateProvider = null;
    this.publicProvider = null;
    this.privateAnchor = null;
    this.publicAnchor = null;
    this.deploymentData = {};
    
    this.loadDeploymentData();
  }

  /**
   * Load deployment data from file
   */
  loadDeploymentData() {
    const deploymentFile = path.join(__dirname, '../deployments.json');
    if (fs.existsSync(deploymentFile)) {
      this.deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    }
  }

  /**
   * Save deployment data to file
   */
  saveDeploymentData() {
    const deploymentFile = path.join(__dirname, '../deployments.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(this.deploymentData, null, 2));
  }

  /**
   * Initialize bridge connections
   */
  async initialize(privateNetwork = 'besu_local', publicNetwork = 'ethereum_sepolia') {
    console.log(`🌉 Initializing Cross-Chain Bridge...`);
    console.log(`Private Network: ${privateNetwork}`);
    console.log(`Public Network: ${publicNetwork}`);

    try {
      // Initialize private network connection (Besu)
      await hre.changeNetwork(privateNetwork);
      this.privateProvider = hre.ethers.provider;
      const [privateSigner] = await hre.ethers.getSigners();
      
      // Initialize public network connection
      await hre.changeNetwork(publicNetwork);
      this.publicProvider = hre.ethers.provider;
      const [publicSigner] = await hre.ethers.getSigners();

      // Load contract instances
      if (this.deploymentData[privateNetwork]?.Anchor) {
        const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
        this.privateAnchor = AnchorFactory.attach(this.deploymentData[privateNetwork].Anchor).connect(privateSigner);
      }

      if (this.deploymentData[publicNetwork]?.Anchor) {
        const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
        this.publicAnchor = AnchorFactory.attach(this.deploymentData[publicNetwork].Anchor).connect(publicSigner);
      }

      console.log("✅ Bridge initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Bridge initialization failed:", error.message);
      return false;
    }
  }

  /**
   * Deploy contracts to both networks
   */
  async deployContracts(privateNetwork = 'besu_local', publicNetwork = 'ethereum_sepolia') {
    console.log("🚀 Deploying contracts to both networks...");

    const deploymentResults = {};

    try {
      // Deploy to private network (Besu)
      console.log(`\n📦 Deploying to private network: ${privateNetwork}`);
      await hre.changeNetwork(privateNetwork);
      const privateDeployment = await this.deployToNetwork(privateNetwork);
      deploymentResults[privateNetwork] = privateDeployment;

      // Deploy to public network
      console.log(`\n📦 Deploying to public network: ${publicNetwork}`);
      await hre.changeNetwork(publicNetwork);
      const publicDeployment = await this.deployToNetwork(publicNetwork);
      deploymentResults[publicNetwork] = publicDeployment;

      // Update deployment data
      this.deploymentData = { ...this.deploymentData, ...deploymentResults };
      this.saveDeploymentData();

      console.log("\n✅ All contracts deployed successfully!");
      console.log("Deployment addresses saved to deployments.json");
      
      return deploymentResults;
    } catch (error) {
      console.error("❌ Contract deployment failed:", error.message);
      throw error;
    }
  }

  /**
   * Deploy contracts to a specific network
   */
  async deployToNetwork(networkName) {
    const [deployer] = await hre.ethers.getSigners();
    const networkInfo = await hre.ethers.provider.getNetwork();
    
    console.log(`Deploying to ${networkName} (Chain ID: ${networkInfo.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);

    const deployments = {};

    // Deploy Anchor contract
    console.log("Deploying Anchor contract...");
    const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
    const anchor = await AnchorFactory.deploy();
    await anchor.waitForDeployment();
    
    deployments.Anchor = await anchor.getAddress();
    console.log(`✅ Anchor deployed to: ${deployments.Anchor}`);

    // Deploy EmploymentContract (example)
    console.log("Deploying EmploymentContract...");
    const EmploymentContractFactory = await hre.ethers.getContractFactory("EmploymentContract");
    
    // Example parameters
    const workerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const employerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const regulatorAddress = deployer.address;
    const salary = hre.ethers.parseEther("1000");
    const termsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    const employmentContract = await EmploymentContractFactory.deploy(
      workerAddress,
      employerAddress,
      salary,
      termsHash,
      regulatorAddress
    );
    await employmentContract.waitForDeployment();
    
    deployments.EmploymentContract = await employmentContract.getAddress();
    console.log(`✅ EmploymentContract deployed to: ${deployments.EmploymentContract}`);

    return deployments;
  }

  /**
   * Anchor data from private chain to public chain
   */
  async anchorToPublic(merkleRoot, metadata = {}) {
    if (!this.publicAnchor) {
      throw new Error("Public anchor contract not initialized");
    }

    console.log(`🔗 Anchoring Merkle root to public chain...`);
    console.log(`Merkle Root: ${merkleRoot}`);

    try {
      // Estimate gas
      const gasEstimate = await this.publicAnchor.anchorNewBatch.estimateGas(merkleRoot);
      console.log(`Estimated gas: ${gasEstimate.toString()}`);

      // Send transaction with retry logic
      let tx;
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          tx = await this.publicAnchor.anchorNewBatch(merkleRoot, {
            gasLimit: gasEstimate * 120n / 100n, // 20% buffer
          });
          break;
        } catch (error) {
          console.log(`Attempt ${attempt} failed: ${error.message}`);
          if (attempt === this.config.retryAttempts) throw error;
          await this.delay(this.config.retryDelay);
        }
      }

      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait(this.config.confirmationBlocks);
      console.log(`✅ Anchored successfully! Block: ${receipt.blockNumber}`);
      
      // Get batch ID from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.publicAnchor.interface.parseLog(log);
          return parsed.name === 'BatchAnchored';
        } catch {
          return false;
        }
      });

      let batchId = null;
      if (event) {
        const parsed = this.publicAnchor.interface.parseLog(event);
        batchId = parsed.args.batchId;
        console.log(`Batch ID: ${batchId}`);
      }

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        batchId: batchId,
        gasUsed: receipt.gasUsed,
        metadata
      };
    } catch (error) {
      console.error("❌ Anchoring failed:", error.message);
      throw error;
    }
  }

  /**
   * Verify anchored data on public chain
   */
  async verifyAnchoredData(batchId) {
    if (!this.publicAnchor) {
      throw new Error("Public anchor contract not initialized");
    }

    try {
      console.log(`🔍 Verifying batch ${batchId} on public chain...`);
      
      const merkleRoot = await this.publicAnchor.getMerkleRoot(batchId);
      const exists = await this.publicAnchor.batchExists(batchId);
      
      console.log(`Batch exists: ${exists}`);
      console.log(`Merkle root: ${merkleRoot}`);
      
      return {
        exists,
        merkleRoot,
        batchId
      };
    } catch (error) {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }

  /**
   * Get cross-chain status
   */
  async getCrossChainStatus() {
    const status = {
      privateChain: { connected: false, latestBatch: null },
      publicChain: { connected: false, latestBatch: null }
    };

    try {
      if (this.privateAnchor) {
        const batchCounter = await this.privateAnchor.batchCounter();
        status.privateChain.connected = true;
        status.privateChain.latestBatch = batchCounter;
      }
    } catch (error) {
      console.log("Private chain connection issue:", error.message);
    }

    try {
      if (this.publicAnchor) {
        const batchCounter = await this.publicAnchor.batchCounter();
        status.publicChain.connected = true;
        status.publicChain.latestBatch = batchCounter;
      }
    } catch (error) {
      console.log("Public chain connection issue:", error.message);
    }

    return status;
  }

  /**
   * Batch process employment contracts from private to public chain
   */
  async batchProcessEmploymentContracts(contractAddresses) {
    console.log(`📋 Processing ${contractAddresses.length} employment contracts...`);
    
    const results = [];
    
    for (let i = 0; i < contractAddresses.length; i += this.config.batchSize) {
      const batch = contractAddresses.slice(i, i + this.config.batchSize);
      console.log(`Processing batch ${Math.floor(i / this.config.batchSize) + 1}...`);
      
      // Create Merkle tree from contract data
      const merkleRoot = await this.createMerkleRoot(batch);
      
      // Anchor to public chain
      const result = await this.anchorToPublic(merkleRoot, {
        contractAddresses: batch,
        batchIndex: Math.floor(i / this.config.batchSize),
        timestamp: Date.now()
      });
      
      results.push(result);
      
      // Delay between batches to avoid rate limiting
      if (i + this.config.batchSize < contractAddresses.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  /**
   * Create Merkle root from contract addresses (simplified)
   */
  async createMerkleRoot(contractAddresses) {
    // This is a simplified implementation
    // In production, you'd use a proper Merkle tree library
    const combined = contractAddresses.join('');
    return hre.ethers.keccak256(hre.ethers.toUtf8Bytes(combined));
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Monitor cross-chain events
   */
  async startEventMonitoring() {
    console.log("👁️  Starting cross-chain event monitoring...");
    
    if (this.privateAnchor) {
      this.privateAnchor.on("BatchAnchored", (batchId, root, sender, event) => {
        console.log(`🔔 Private Chain - New batch anchored: ${batchId}`);
        console.log(`   Root: ${root}`);
        console.log(`   Sender: ${sender}`);
      });
    }

    if (this.publicAnchor) {
      this.publicAnchor.on("BatchAnchored", (batchId, root, sender, event) => {
        console.log(`🔔 Public Chain - New batch anchored: ${batchId}`);
        console.log(`   Root: ${root}`);
        console.log(`   Sender: ${sender}`);
      });
    }
  }

  /**
   * Stop event monitoring
   */
  stopEventMonitoring() {
    console.log("🛑 Stopping event monitoring...");
    
    if (this.privateAnchor) {
      this.privateAnchor.removeAllListeners();
    }
    
    if (this.publicAnchor) {
      this.publicAnchor.removeAllListeners();
    }
  }
}

module.exports = CrossChainBridge;

// CLI interface
if (require.main === module) {
  async function main() {
    const bridge = new CrossChainBridge();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'deploy':
        const privateNet = process.argv[3] || 'besu_local';
        const publicNet = process.argv[4] || 'ethereum_sepolia';
        await bridge.deployContracts(privateNet, publicNet);
        break;
        
      case 'init':
        const initPrivateNet = process.argv[3] || 'besu_local';
        const initPublicNet = process.argv[4] || 'ethereum_sepolia';
        await bridge.initialize(initPrivateNet, initPublicNet);
        break;
        
      case 'anchor':
        const merkleRoot = process.argv[3];
        if (!merkleRoot) {
          console.error("Please provide a Merkle root to anchor");
          process.exit(1);
        }
        await bridge.initialize();
        await bridge.anchorToPublic(merkleRoot);
        break;
        
      case 'verify':
        const batchId = process.argv[3];
        if (!batchId) {
          console.error("Please provide a batch ID to verify");
          process.exit(1);
        }
        await bridge.initialize();
        await bridge.verifyAnchoredData(batchId);
        break;
        
      case 'status':
        await bridge.initialize();
        const status = await bridge.getCrossChainStatus();
        console.log("Cross-chain status:", JSON.stringify(status, null, 2));
        break;
        
      case 'monitor':
        await bridge.initialize();
        await bridge.startEventMonitoring();
        console.log("Monitoring events... Press Ctrl+C to stop");
        process.on('SIGINT', () => {
          bridge.stopEventMonitoring();
          process.exit(0);
        });
        break;
        
      default:
        console.log(`
Usage: node bridge-service.js <command> [options]

Commands:
  deploy <private_network> <public_network>  Deploy contracts to both networks
  init <private_network> <public_network>    Initialize bridge connections
  anchor <merkle_root>                       Anchor data to public chain
  verify <batch_id>                          Verify anchored data
  status                                     Get cross-chain status
  monitor                                    Monitor cross-chain events

Examples:
  node bridge-service.js deploy besu_local ethereum_sepolia
  node bridge-service.js anchor 0x1234...
  node bridge-service.js verify 1
  node bridge-service.js status
        `);
    }
  }
  
  main().catch(console.error);
}

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const NETWORK_CONFIGS = {
  besu_local: { name: "besu_local", displayName: "Hyperledger Besu (Local)", isTestnet: true },
  ethereum_mainnet: { name: "ethereum_mainnet", displayName: "Ethereum Mainnet", isTestnet: false },
  ethereum_sepolia: { name: "ethereum_sepolia", displayName: "Ethereum Sepolia", isTestnet: true },
  polygon_mainnet: { name: "polygon_mainnet", displayName: "Polygon Mainnet", isTestnet: false },
  polygon_mumbai: { name: "polygon_mumbai", displayName: "Polygon Mumbai", isTestnet: true },
  bsc_mainnet: { name: "bsc_mainnet", displayName: "BSC Mainnet", isTestnet: false },
  bsc_testnet: { name: "bsc_testnet", displayName: "BSC Testnet", isTestnet: true },
};

/**
 * Cross-Chain Bridge Deployment Script
 * Deploys contracts to both private (Besu) and public blockchain networks
 */
class BridgeDeployer {
  constructor() {
    this.deploymentFile = path.join(__dirname, '../deployments.json');
    this.deploymentResults = {};
    this.loadExistingDeployments();
  }

  /**
   * Load existing deployment data
   */
  loadExistingDeployments() {
    if (fs.existsSync(this.deploymentFile)) {
      try {
        const data = fs.readFileSync(this.deploymentFile, 'utf8');
        this.deploymentResults = JSON.parse(data);
      } catch (error) {
        console.warn("Could not load existing deployments:", error.message);
        this.deploymentResults = {};
      }
    }
  }

  /**
   * Save deployment results to file
   */
  saveDeployments() {
    try {
      fs.writeFileSync(this.deploymentFile, JSON.stringify(this.deploymentResults, null, 2));
      console.log(`✅ Deployment data saved to ${this.deploymentFile}`);
    } catch (error) {
      console.error("❌ Failed to save deployment data:", error.message);
    }
  }

  /**
   * Deploy contracts to current network
   */
  async deployToCurrentNetwork() {
    const networkName = hre.network.name;
    const networkConfig = NETWORK_CONFIGS[networkName] || { 
      name: networkName, 
      displayName: networkName, 
      isTestnet: true 
    };

    console.log(`\n🚀 Deploying to ${networkConfig.displayName}...`);
    console.log("=".repeat(60));

    const [deployer] = await hre.ethers.getSigners();
    const networkInfo = await hre.ethers.provider.getNetwork();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    console.log(`Network: ${networkConfig.displayName}`);
    console.log(`Chain ID: ${networkInfo.chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

    // Check if we have sufficient balance
    const minBalance = networkConfig.isTestnet ? hre.ethers.parseEther("0.01") : hre.ethers.parseEther("0.001");
    if (balance < minBalance) {
      console.warn(`⚠️  Low balance. Recommended: at least ${hre.ethers.formatEther(minBalance)} ETH`);
    }

    const contracts = {};
    let totalGasUsed = 0n;

    try {
      // Deploy Anchor contract
      console.log("\n📦 Deploying Anchor contract...");
      const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
      
      const anchor = await AnchorFactory.deploy();
      await anchor.waitForDeployment();
      
      const anchorAddress = await anchor.getAddress();
      contracts.Anchor = anchorAddress;
      
      const anchorReceipt = await anchor.deploymentTransaction()?.wait();
      if (anchorReceipt) {
        totalGasUsed += anchorReceipt.gasUsed;
        console.log(`✅ Anchor deployed to: ${anchorAddress}`);
        console.log(`   Gas used: ${anchorReceipt.gasUsed.toString()}`);
        console.log(`   Transaction: ${anchorReceipt.hash}`);
      }

      // Verify Anchor contract deployment
      const owner = await anchor.owner();
      const batchCounter = await anchor.batchCounter();
      console.log(`   Owner: ${owner}`);
      console.log(`   Initial batch counter: ${batchCounter}`);

      // Deploy EmploymentContract (example)
      console.log("\n📦 Deploying EmploymentContract...");
      const EmploymentContractFactory = await hre.ethers.getContractFactory("EmploymentContract");
      
      // Use different addresses for different networks
      const workerAddress = networkConfig.isTestnet 
        ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" 
        : "0x8ba1f109551bD432803012645Hac136c5C1515A9";
      const employerAddress = networkConfig.isTestnet 
        ? "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" 
        : "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097";
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
      
      const employmentAddress = await employmentContract.getAddress();
      contracts.EmploymentContract = employmentAddress;
      
      const employmentReceipt = await employmentContract.deploymentTransaction()?.wait();
      if (employmentReceipt) {
        totalGasUsed += employmentReceipt.gasUsed;
        console.log(`✅ EmploymentContract deployed to: ${employmentAddress}`);
        console.log(`   Gas used: ${employmentReceipt.gasUsed.toString()}`);
        console.log(`   Transaction: ${employmentReceipt.hash}`);
      }

      // Verify EmploymentContract deployment
      const contractWorker = await employmentContract.worker();
      const contractEmployer = await employmentContract.employer();
      const contractStatus = await employmentContract.status();
      console.log(`   Worker: ${contractWorker}`);
      console.log(`   Employer: ${contractEmployer}`);
      console.log(`   Status: ${contractStatus} (0=Proposed)`);

      // Create deployment result
      const result = {
        network: networkName,
        chainId: Number(networkInfo.chainId),
        contracts,
        deployer: deployer.address,
        gasUsed: totalGasUsed.toString(),
        timestamp: Date.now()
      };

      // Save deployment result
      this.deploymentResults[networkName] = result;
      this.saveDeployments();

      console.log(`\n✅ Deployment to ${networkConfig.displayName} completed!`);
      console.log(`Total gas used: ${totalGasUsed.toString()}`);
      
      // Test basic functionality
      await this.testBasicFunctionality(anchor, employmentContract);
      
      return result;

    } catch (error) {
      console.error(`❌ Deployment to ${networkConfig.displayName} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Test basic contract functionality
   */
  async testBasicFunctionality(anchor, employmentContract) {
    console.log("\n🧪 Testing basic contract functionality...");
    
    try {
      // Test Anchor contract
      const testMerkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      console.log("Testing Anchor contract...");
      
      const tx = await anchor.anchorNewBatch(testMerkleRoot);
      await tx.wait();
      
      const batchCounter = await anchor.batchCounter();
      const storedRoot = await anchor.getMerkleRoot(1);
      
      console.log(`✅ Anchor test successful:`);
      console.log(`   Batch counter: ${batchCounter}`);
      console.log(`   Stored root: ${storedRoot}`);
      
      // Test EmploymentContract basic functions
      console.log("Testing EmploymentContract...");
      const worker = await employmentContract.worker();
      const employer = await employmentContract.employer();
      const status = await employmentContract.status();
      
      console.log(`✅ EmploymentContract test successful:`);
      console.log(`   Worker: ${worker}`);
      console.log(`   Employer: ${employer}`);
      console.log(`   Status: ${status}`);

    } catch (error) {
      console.warn("⚠️  Basic functionality test failed:", error.message);
    }
  }

  /**
   * Display deployment summary
   */
  displayDeploymentSummary() {
    console.log("\n🎉 DEPLOYMENT SUMMARY");
    console.log("=".repeat(80));

    for (const [network, result] of Object.entries(this.deploymentResults)) {
      const config = NETWORK_CONFIGS[network] || { displayName: network };
      console.log(`\n${config.displayName}:`);
      console.log(`  Chain ID: ${result.chainId}`);
      console.log(`  Deployer: ${result.deployer}`);
      console.log(`  Gas Used: ${result.gasUsed}`);
      console.log(`  Contracts:`);
      
      for (const [contractName, address] of Object.entries(result.contracts)) {
        console.log(`    ${contractName}: ${address}`);
      }
    }

    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file with actual API keys and private keys");
    console.log("2. Test the bridge functionality using the bridge-service.js");
    console.log("3. Set up monitoring for cross-chain events");
    console.log("4. Configure automated anchoring service");
    
    console.log("\n🔧 Bridge Service Commands:");
    console.log(`node scripts/bridge-service.js status`);
    console.log(`node scripts/bridge-service.js monitor`);
    console.log(`node scripts/bridge-service.js anchor <merkle_root>`);
  }
}

// Main execution
async function main() {
  const deployer = new BridgeDeployer();
  
  console.log("🌉 Cross-Chain Bridge Deployment");
  console.log("=".repeat(80));
  console.log(`Current Network: ${hre.network.name}`);
  console.log();

  try {
    const result = await deployer.deployToCurrentNetwork();
    deployer.displayDeploymentSummary();
    
    console.log("\n✅ Deployment completed successfully!");
    console.log("\n📖 Usage Instructions:");
    console.log("To deploy to different networks, use:");
    console.log(`npx hardhat run scripts/deployBridge.js --network besu_local`);
    console.log(`npx hardhat run scripts/deployBridge.js --network ethereum_sepolia`);
    console.log(`npx hardhat run scripts/deployBridge.js --network polygon_mumbai`);
    
    return result;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Unexpected error:", error);
      process.exit(1);
    });
}

module.exports = BridgeDeployer;

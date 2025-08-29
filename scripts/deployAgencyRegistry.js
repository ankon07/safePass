const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('🚀 Deploying AgencyRegistry contract...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH');

  try {
    // Deploy AgencyRegistry contract
    console.log('\n📋 Deploying AgencyRegistry...');
    const AgencyRegistry = await ethers.getContractFactory('AgencyRegistry');
    const agencyRegistry = await AgencyRegistry.deploy();
    
    // Wait for deployment
    await agencyRegistry.waitForDeployment();
    const agencyRegistryAddress = await agencyRegistry.getAddress();
    
    console.log('✅ AgencyRegistry deployed to:', agencyRegistryAddress);

    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const agencyCount = await agencyRegistry.getAgencyCount();
    console.log('Initial agency count:', agencyCount.toString());

    // Save deployment info
    const deploymentInfo = {
      network: 'besu_local',
      agencyRegistry: {
        address: agencyRegistryAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await deployer.provider.getBlockNumber()
      }
    };

    // Read existing deployments or create new
    let deployments = {};
    try {
      const existingDeployments = fs.readFileSync('deployments.json', 'utf8');
      deployments = JSON.parse(existingDeployments);
    } catch (error) {
      console.log('Creating new deployments.json file');
    }

    // Update deployments
    deployments.agencyRegistry = deploymentInfo.agencyRegistry;

    // Write updated deployments
    fs.writeFileSync('deployments.json', JSON.stringify(deployments, null, 2));
    console.log('✅ Deployment info saved to deployments.json');

    // Display summary
    console.log('\n📊 Deployment Summary:');
    console.log('='.repeat(50));
    console.log(`AgencyRegistry: ${agencyRegistryAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Network: besu_local`);
    console.log(`Gas Used: Contract deployment`);
    console.log('='.repeat(50));

    console.log('\n🎯 Next Steps:');
    console.log('1. Update your .env file with:');
    console.log(`   AGENCY_REGISTRY_ADDRESS=${agencyRegistryAddress}`);
    console.log('2. Register agencies using the API endpoints');
    console.log('3. Start the trust score calculation service');

    return {
      agencyRegistry: agencyRegistryAddress
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;

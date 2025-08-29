const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Proper ERC-1056 Registry Contract to Besu Network...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // Deploy the EthereumDIDRegistry contract
    console.log("Deploying EthereumDIDRegistry contract...");
    
    const EthereumDIDRegistry = await hre.ethers.getContractFactory("EthereumDIDRegistry");
    const registry = await EthereumDIDRegistry.deploy({
      gasLimit: 3000000,
      gasPrice: hre.ethers.parseUnits("1000000000", "wei") // 1 gwei
    });

    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    
    console.log("✅ EthereumDIDRegistry deployed to:", registryAddress);
    console.log("   - Transaction hash:", registry.deploymentTransaction()?.hash);
    console.log();

    // Verify the deployment by calling a simple function
    console.log("Verifying deployment...");
    try {
      const testAddress = "0x1234567890123456789012345678901234567890";
      const owner = await registry.identityOwner(testAddress);
      console.log("✅ Contract is working - identityOwner test successful");
      console.log("   - Test address:", testAddress);
      console.log("   - Returned owner:", owner);
    } catch (error) {
      console.log("⚠️  Contract deployed but verification failed:", error.message);
    }
    console.log();

    // Summary
    console.log("🎉 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("Registry Address:  ", registryAddress);
    console.log("Network:           ", hre.network.name);
    console.log("Deployer:          ", deployer.address);
    console.log("=".repeat(50));
    console.log();

    console.log("📝 Next Steps:");
    console.log("1. Update the DID resolver configuration in identityService.ts:");
    console.log(`   registry: '${registryAddress}'`);
    console.log("2. Restart your API server to use the new registry");
    console.log();

    // Save the address to a file for easy reference
    const fs = require('fs');
    const deploymentInfo = {
      registryAddress: registryAddress,
      network: hre.network.name,
      deployer: deployer.address,
      transactionHash: registry.deploymentTransaction()?.hash,
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('proper-registry-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to proper-registry-deployment.json");

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

// Execute the deployment
main().catch((error) => {
  console.error("❌ Unexpected error:");
  console.error(error);
  process.exitCode = 1;
});

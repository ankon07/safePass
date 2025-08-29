const hre = require("hardhat");
const { writeFileSync } = require("fs");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying Anchor contract to Ethereum Sepolia testnet...");

  // Get the contract factory
  const Anchor = await hre.ethers.getContractFactory("Anchor");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const anchor = await Anchor.deploy();

  // Wait for deployment to complete
  await anchor.waitForDeployment();
  const contractAddress = await anchor.getAddress();

  console.log("✅ Anchor contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

  // Save deployment information
  const deploymentInfo = {
    network: "ethereum_sepolia",
    contractName: "Anchor",
    contractAddress: contractAddress,
    deploymentTime: new Date().toISOString(),
    deployer: await anchor.runner?.getAddress(),
    transactionHash: anchor.deploymentTransaction()?.hash
  };

  // Write deployment info to file
  writeFileSync(
    "sepolia-anchor-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment information saved to sepolia-anchor-deployment.json");
  console.log("\n🔧 Next steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   SEPOLIA_ANCHOR_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Verify the contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network ethereum_sepolia ${contractAddress}`);
  console.log("3. Test the anchoring service with:");
  console.log("   npm run anchor:test");

  // Verify contract deployment by calling a view function
  try {
    const batchCounter = await anchor.batchCounter();
    console.log(`🔍 Contract verification: batchCounter = ${batchCounter}`);
  } catch (error) {
    console.warn("⚠️  Could not verify contract deployment:", error);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

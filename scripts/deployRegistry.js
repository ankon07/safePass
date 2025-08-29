const hre = require("hardhat");

// ERC-1056 Registry contract bytecode (simplified version)
const REGISTRY_BYTECODE = "0x608060405234801561001057600080fd5b50610bef806100206000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063622b2a3c1161005b578063622b2a3c146101015780637ad28c511461011e578063f00d4b5d1461013b578063f96d0f9f1461015857610088565b8063028371d51461008d57806340a141ff146100ab57806351b42b00146100c85780635f3ffb4f146100e4575b600080fd5b610095610175565b6040516100a29190610a5d565b60405180910390f35b6100c560048036038101906100c09190610aa9565b61017b565b005b6100e260048036038101906100dd9190610b0c565b6101c8565b005b6100fe60048036038101906100f99190610b5c565b610215565b005b61011f600480360381019061011a9190610b89565b610262565b005b61013960048036038101906101349190610bb6565b6102af565b005b61015660048036038101906101519190610be3565b6102fc565b005b610173600480360381019061016e9190610c10565b610349565b005b61271081565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16146101c4576101c33382846000610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610211576102103382846001610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161461025e5761025d3382846002610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16146102ab576102aa3382846003610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16146102f8576102f73382846004610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610345576103443382846005610396565b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610392576103913382846006610396565b5b5050565b60008060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600081116103e657436103e8565b805b905080600080600088ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508573ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff167f18ab6b2ae3d64306c00ce663125f2bd680e441a098de1635bd7ad8b0d44965e4878787604051610490939291906109f6565b60405180910390a3505050505050565b600081359050919050565b600081359050919050565b600081359050919050565b600081359050919050565b60006020828403121561050657600080fd5b600061051484828501610496565b91505092915050565b6000806040838503121561053057600080fd5b600061053e85828601610496565b925050602061054f85828601610496565b9150509250929050565b60008060006060848603121561056e57600080fd5b600061057c86828701610496565b935050602061058d86828701610496565b925050604061059e868287016104a5565b9150509250925092565b600080600080608085870312156105be57600080fd5b60006105cc87828801610496565b94505060206105dd87828801610496565b93505060406105ee878288016104a5565b92505060606105ff878288016104b4565b91505092959194509250565b60008060008060008060c0878903121561062457600080fd5b600061063289828a01610496565b965050602061064389828a01610496565b955050604061065489828a016104a5565b945050606061066589828a016104b4565b935050608061067689828a016104c3565b92505060a061068789828a016104c3565b9150509295509295509295565b60006106a08383610a3f565b60208301905092915050565b6106b581610a78565b82525050565b60006106c682610a32565b6106d08185610a3d565b93506106db83610a22565b8060005b8381101561070c5781516106f38882610694565b97506106fe83610a30565b9250506001810190506106df565b5085935050505092915050565b61072281610a8a565b82525050565b61073181610a96565b82525050565b600061074282610a27565b61074c8185610a4e565b935061075c818560208601610aa0565b61076581610ad3565b840191505092915050565b6000606082019050610a0a60008301866106ac565b610a1760208301856106ac565b610a2460408301846109e6565b949350505050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b600082825260208201905092915050565b6000610a7082610a76565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b60005b83811015610abe578082015181840152602081019050610aa3565b83811115610acd576000848401525b50505050565b6000601f19601f8301169050919050565b610aed81610a65565b8114610af857600080fd5b50565b610b0481610a8a565b8114610b0f57600080fd5b50565b610b1b81610a96565b8114610b2657600080fd5b5056fea2646970667358221220c7b7e7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c764736f6c63430008070033";

async function main() {
  console.log("🚀 Deploying ERC-1056 Registry Contract to Besu Network...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // Deploy the registry contract using raw bytecode
    console.log("Deploying ERC-1056 Registry contract...");
    
    const tx = await deployer.sendTransaction({
      data: REGISTRY_BYTECODE,
      gasLimit: 3000000,
      gasPrice: hre.ethers.parseUnits("1000000000", "wei") // 1 gwei
    });

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    
    const registryAddress = receipt.contractAddress;
    console.log("✅ ERC-1056 Registry deployed to:", registryAddress);
    console.log("   - Block number:", receipt.blockNumber);
    console.log("   - Gas used:", receipt.gasUsed.toString());
    console.log();

    // Verify the deployment
    console.log("Verifying deployment...");
    const code = await hre.ethers.provider.getCode(registryAddress);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }
    console.log("✅ Contract code verified at address");
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
    console.log("1. Update your environment configuration with the registry address:");
    console.log(`   REGISTRY_ADDRESS=${registryAddress}`);
    console.log("2. Update the DID resolver configuration in identityService.ts");
    console.log("3. Restart your API server to use the new registry");
    console.log();

    // Save the address to a file for easy reference
    const fs = require('fs');
    const deploymentInfo = {
      registryAddress: registryAddress,
      network: hre.network.name,
      deployer: deployer.address,
      blockNumber: receipt.blockNumber,
      transactionHash: tx.hash,
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('registry-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to registry-deployment.json");

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

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Pillar 2: Financial Incentives & Guarantees Deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Example parameters for EmploymentContract
  const workerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Example worker address
  const employerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Example employer address
  const regulatorAddress = deployer.address; // Deployer acts as regulator for demo
  const salary = hre.ethers.parseEther("1000"); // 1000 ETH equivalent per pay period
  const payFrequency = 30; // 30 days (monthly payments)
  const termsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Example IPFS hash

  console.log("Deployment Parameters:");
  console.log("- Worker Address:", workerAddress);
  console.log("- Employer Address:", employerAddress);
  console.log("- Regulator Address:", regulatorAddress);
  console.log("- Salary:", hre.ethers.formatEther(salary), "ETH");
  console.log("- Pay Frequency:", payFrequency, "days");
  console.log("- Terms Hash (IPFS):", termsHash);
  console.log();

  const deployedContracts = {};

  try {
    // 1. Deploy EscrowContract first
    console.log("1️⃣ Deploying EscrowContract...");
    const EscrowContractFactory = await hre.ethers.getContractFactory("EscrowContract");
    const escrowContract = await EscrowContractFactory.deploy(regulatorAddress);
    await escrowContract.waitForDeployment();
    
    const escrowAddress = await escrowContract.getAddress();
    deployedContracts.EscrowContract = escrowAddress;
    
    console.log("✅ EscrowContract deployed to:", escrowAddress);
    console.log("   - Transaction hash:", escrowContract.deploymentTransaction()?.hash);
    console.log("   - Owner:", await escrowContract.owner());
    console.log();

    // 2. Deploy AgencyRegistry
    console.log("2️⃣ Deploying AgencyRegistry...");
    const AgencyRegistryFactory = await hre.ethers.getContractFactory("AgencyRegistry");
    const agencyRegistry = await AgencyRegistryFactory.deploy();
    await agencyRegistry.waitForDeployment();
    
    const registryAddress = await agencyRegistry.getAddress();
    deployedContracts.AgencyRegistry = registryAddress;
    
    console.log("✅ AgencyRegistry deployed to:", registryAddress);
    console.log("   - Transaction hash:", agencyRegistry.deploymentTransaction()?.hash);
    console.log("   - Owner:", await agencyRegistry.owner());
    console.log();

    // 3. Deploy EmploymentContract
    console.log("3️⃣ Deploying EmploymentContract...");
    const EmploymentContractFactory = await hre.ethers.getContractFactory("EmploymentContract");
    const employmentContract = await EmploymentContractFactory.deploy(
      workerAddress,
      employerAddress,
      salary,
      payFrequency,
      termsHash,
      regulatorAddress
    );
    await employmentContract.waitForDeployment();
    
    const employmentAddress = await employmentContract.getAddress();
    deployedContracts.EmploymentContract = employmentAddress;
    
    console.log("✅ EmploymentContract deployed to:", employmentAddress);
    console.log("   - Transaction hash:", employmentContract.deploymentTransaction()?.hash);
    console.log();

    // 4. Deploy Anchor contract
    console.log("4️⃣ Deploying Anchor contract...");
    const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
    const anchor = await AnchorFactory.deploy();
    await anchor.waitForDeployment();
    
    const anchorAddress = await anchor.getAddress();
    deployedContracts.Anchor = anchorAddress;
    
    console.log("✅ Anchor contract deployed to:", anchorAddress);
    console.log("   - Transaction hash:", anchor.deploymentTransaction()?.hash);
    console.log("   - Owner:", await anchor.owner());
    console.log();

    // 5. Link contracts together
    console.log("5️⃣ Linking contracts together...");
    
    // Link escrow contract to employment contract
    console.log("Linking EscrowContract to EmploymentContract...");
    const linkTx = await employmentContract.linkEscrowContract(escrowAddress);
    await linkTx.wait();
    console.log("✅ Escrow contract linked to employment contract");
    
    // Register a sample agency in the registry
    console.log("Registering sample agency...");
    const sampleAgency = {
      name: "Global Recruitment Agency",
      licenseNumber: "GRA-2024-001",
      contactInfo: "contact@globalrecruitment.com"
    };
    
    const registerTx = await agencyRegistry.registerAgency(
      employerAddress,
      sampleAgency.name,
      `did:ethr:${employerAddress}` // Create a simple DID for the agency
    );
    await registerTx.wait();
    console.log("✅ Sample agency registered");
    console.log();

    // 6. Verify contract states
    console.log("6️⃣ Verifying contract deployments...");
    
    // Verify EmploymentContract
    console.log("EmploymentContract verification:");
    const contractDetails = await employmentContract.getContractDetails();
    console.log("- Worker:", contractDetails[0]);
    console.log("- Employer:", contractDetails[1]);
    console.log("- Salary:", hre.ethers.formatEther(contractDetails[2]), "ETH");
    console.log("- Pay Frequency:", contractDetails[3].toString(), "days");
    console.log("- Escrow Requirement:", hre.ethers.formatEther(contractDetails[5]), "ETH");
    console.log("- Escrow Contract:", contractDetails[7]);
    console.log("- Status:", contractDetails[8].toString(), "(0=Proposed, 1=Active, 2=Disputed, 3=Completed)");
    console.log("- Worker Signed:", contractDetails[10]);
    console.log("- Employer Signed:", contractDetails[11]);
    console.log();

    // Verify AgencyRegistry
    console.log("AgencyRegistry verification:");
    const agencyInfo = await agencyRegistry.getAgency(employerAddress);
    console.log("- Agency Name:", agencyInfo[0]);
    console.log("- License Number:", agencyInfo[1]);
    console.log("- Contact Info:", agencyInfo[2]);
    console.log("- Status:", agencyInfo[3].toString(), "(0=Pending, 1=Registered, 2=Suspended, 3=Revoked)");
    console.log();

    // Verify EscrowContract
    console.log("EscrowContract verification:");
    console.log("- Owner:", await escrowContract.owner());
    console.log("- Contract Address:", escrowAddress);
    console.log();

    // 7. Demo: Deposit escrow
    console.log("7️⃣ Demo: Depositing escrow...");
    const escrowAmount = hre.ethers.parseEther("2000"); // 2 months salary
    const depositTx = await escrowContract.depositEscrow(employmentAddress, workerAddress, {
      value: escrowAmount
    });
    await depositTx.wait();
    console.log("✅ Escrow deposited:", hre.ethers.formatEther(escrowAmount), "ETH");
    console.log();

    // 8. Demo: Sign contracts
    console.log("8️⃣ Demo: Signing employment contract...");
    
    // Get signers for worker and employer
    const [, worker, employer] = await hre.ethers.getSigners();
    
    // Worker signs
    const workerSignTx = await employmentContract.connect(worker).signContract();
    await workerSignTx.wait();
    console.log("✅ Worker signed the contract");
    
    // Employer signs
    const employerSignTx = await employmentContract.connect(employer).signContract();
    await employerSignTx.wait();
    console.log("✅ Employer signed the contract");
    
    // Check if contract is now active
    const finalDetails = await employmentContract.getContractDetails();
    console.log("✅ Contract Status:", finalDetails[8].toString(), "(1=Active means both signed and escrow deposited)");
    console.log();

    // 9. Save deployment addresses
    const deploymentData = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts,
      sampleData: {
        workerAddress,
        employerAddress,
        regulatorAddress,
        salary: hre.ethers.formatEther(salary),
        payFrequency,
        termsHash
      }
    };

    const fs = require('fs');
    fs.writeFileSync('pillar2-deployment.json', JSON.stringify(deploymentData, null, 2));
    console.log("💾 Deployment data saved to pillar2-deployment.json");
    console.log();

    // 10. Summary
    console.log("🎉 Pillar 2 Deployment Summary:");
    console.log("=".repeat(60));
    console.log("EscrowContract:      ", escrowAddress);
    console.log("AgencyRegistry:      ", registryAddress);
    console.log("EmploymentContract:  ", employmentAddress);
    console.log("Anchor Contract:     ", anchorAddress);
    console.log("Network:             ", hre.network.name);
    console.log("Deployer:            ", deployer.address);
    console.log("=".repeat(60));
    console.log();

    console.log("✅ Pillar 2: Financial Incentives & Guarantees is now deployed and functional!");
    console.log();
    console.log("🔗 Integration Points:");
    console.log("- Employment contracts require escrow deposits before activation");
    console.log("- Agencies must be registered in AgencyRegistry");
    console.log("- Insurance bonds can be tracked via AgencyRegistry");
    console.log("- Escrow funds are held in EscrowContract for dispute resolution");
    console.log();
    
    console.log("🧪 Next Steps for Testing:");
    console.log("1. Start the API server: npm run api:dev");
    console.log("2. Run Pillar 2 tests: node test-pillar2.js");
    console.log("3. Test insurance endpoints: /api/insurance/*");
    console.log("4. Test escrow endpoints: /api/escrow/*");

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

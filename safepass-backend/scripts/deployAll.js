"use strict";
const hre = require("hardhat");
async function main() {
    console.log("Starting deployment of SafePass contracts...\n");
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");
    // Example parameters for EmploymentContract
    const workerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Example worker address
    const employerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Example employer address
    const regulatorAddress = deployer.address; // Deployer acts as regulator for demo
    const salary = hre.ethers.parseEther("1000"); // 1000 ETH equivalent per pay period
    const termsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Example IPFS hash
    console.log("Deployment Parameters:");
    console.log("- Worker Address:", workerAddress);
    console.log("- Employer Address:", employerAddress);
    console.log("- Regulator Address:", regulatorAddress);
    console.log("- Salary:", hre.ethers.formatEther(salary), "ETH");
    console.log("- Terms Hash (IPFS):", termsHash);
    console.log();
    try {
        // Deploy EmploymentContract
        console.log("Deploying EmploymentContract...");
        const EmploymentContractFactory = await hre.ethers.getContractFactory("EmploymentContract");
        const employmentContract = await EmploymentContractFactory.deploy(workerAddress, employerAddress, salary, termsHash, regulatorAddress);
        await employmentContract.waitForDeployment();
        console.log("✅ EmploymentContract deployed to:", await employmentContract.getAddress());
        console.log("   - Transaction hash:", employmentContract.deploymentTransaction()?.hash);
        console.log();
        // Deploy Anchor contract
        console.log("Deploying Anchor contract...");
        const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
        const anchor = await AnchorFactory.deploy();
        await anchor.waitForDeployment();
        console.log("✅ Anchor contract deployed to:", await anchor.getAddress());
        console.log("   - Transaction hash:", anchor.deploymentTransaction()?.hash);
        console.log("   - Owner:", await anchor.owner());
        console.log();
        // Verify contract states
        console.log("Verifying contract deployments...");
        // Verify EmploymentContract
        console.log("EmploymentContract verification:");
        console.log("- Worker:", await employmentContract.worker());
        console.log("- Employer:", await employmentContract.employer());
        console.log("- Salary:", hre.ethers.formatEther(await employmentContract.salary()), "ETH");
        console.log("- Terms Hash:", await employmentContract.termsHash());
        console.log("- Regulator:", await employmentContract.regulator());
        console.log("- Status:", await employmentContract.status(), "(0=Proposed, 1=Active, 2=Disputed, 3=Completed)");
        console.log("- Worker Signed:", await employmentContract.workerSigned());
        console.log("- Employer Signed:", await employmentContract.employerSigned());
        console.log();
        // Verify Anchor
        console.log("Anchor contract verification:");
        console.log("- Owner:", await anchor.owner());
        console.log("- Batch Counter:", await anchor.batchCounter());
        console.log();
        // Demo: Anchor a sample Merkle root
        console.log("Demo: Anchoring a sample Merkle root...");
        const sampleMerkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const anchorTx = await anchor.anchorNewBatch(sampleMerkleRoot);
        await anchorTx.wait();
        console.log("✅ Sample Merkle root anchored:");
        console.log("- Merkle Root:", sampleMerkleRoot);
        console.log("- Batch ID:", await anchor.batchCounter());
        console.log("- Transaction hash:", anchorTx.hash);
        console.log();
        // Summary
        console.log("🎉 Deployment Summary:");
        console.log("=".repeat(50));
        console.log("EmploymentContract:", await employmentContract.getAddress());
        console.log("Anchor Contract:   ", await anchor.getAddress());
        console.log("Network:           ", hre.network.name);
        console.log("Deployer:          ", deployer.address);
        console.log("=".repeat(50));
        console.log();
        console.log("Next Steps:");
        console.log("1. Worker and Employer can sign the employment contract");
        console.log("2. Once both parties sign, the contract becomes Active");
        console.log("3. Employer can record payments using recordPayment()");
        console.log("4. Worker can raise disputes if needed using raiseDispute()");
        console.log("5. Backend service can anchor Merkle roots using anchorNewBatch()");
        console.log();
        console.log("Example interactions:");
        console.log(`- Worker signs: employmentContract.connect(worker).signContract()`);
        console.log(`- Employer signs: employmentContract.connect(employer).signContract()`);
        console.log(`- Record payment: employmentContract.connect(employer).recordPayment(ethers.parseEther("500"))`);
        console.log(`- Anchor batch: anchor.anchorNewBatch("0x...")`);
    }
    catch (error) {
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

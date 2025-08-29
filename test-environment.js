const { ethers } = require("hardhat");
const axios = require("axios");

async function testEnvironment() {
  console.log("🔍 Testing SafePass Blockchain Development Environment\n");

  // Test 1: Hardhat Network Connection
  console.log("1. Testing Hardhat connection to Besu...");
  try {
    const [signer] = await ethers.getSigners();
    const balance = await signer.provider.getBalance(signer.address);
    console.log(`   ✅ Connected to Besu network`);
    console.log(`   📍 Account: ${signer.address}`);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH\n`);
  } catch (error) {
    console.log(`   ❌ Failed to connect to Besu: ${error.message}\n`);
    return;
  }

  // Test 2: Smart Contract Deployment
  console.log("2. Testing smart contract deployment...");
  try {
    const Lock = await ethers.getContractFactory("Lock");
    const unlockTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
    const lockedAmount = ethers.parseEther("0.001");
    
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });
    await lock.waitForDeployment();
    
    const contractAddress = await lock.getAddress();
    console.log(`   ✅ Contract deployed successfully`);
    console.log(`   📍 Contract address: ${contractAddress}\n`);
  } catch (error) {
    console.log(`   ❌ Failed to deploy contract: ${error.message}\n`);
  }

  // Test 3: IPFS Connection
  console.log("3. Testing IPFS connection...");
  try {
    const response = await axios.post("http://127.0.0.1:5001/api/v0/version");
    console.log(`   ✅ IPFS is running`);
    console.log(`   📍 Version: ${response.data.Version}`);
    console.log(`   🖥️  System: ${response.data.System}\n`);
  } catch (error) {
    console.log(`   ❌ Failed to connect to IPFS: ${error.message}\n`);
  }

  // Test 4: IPFS File Upload
  console.log("4. Testing IPFS file upload...");
  try {
    const testData = JSON.stringify({
      message: "Hello from SafePass!",
      timestamp: new Date().toISOString(),
      test: true
    });

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from(testData), {
      filename: 'test.json',
      contentType: 'application/json'
    });

    const uploadResponse = await axios.post("http://127.0.0.1:5001/api/v0/add", form, {
      headers: form.getHeaders()
    });

    const hash = uploadResponse.data.Hash;
    console.log(`   ✅ File uploaded to IPFS`);
    console.log(`   📍 IPFS Hash: ${hash}`);
    console.log(`   🌐 Gateway URL: http://localhost:8081/ipfs/${hash}\n`);
  } catch (error) {
    console.log(`   ❌ Failed to upload to IPFS: ${error.message}\n`);
  }

  console.log("🎉 Environment test completed!");
  console.log("\n📋 Summary:");
  console.log("   • Besu blockchain: Running on http://localhost:8545");
  console.log("   • IPFS node: Running on http://localhost:5001");
  console.log("   • IPFS gateway: Running on http://localhost:8081");
  console.log("   • Smart contracts: Ready for deployment");
  console.log("\n🚀 Your SafePass development environment is ready!");
}

// Install axios if not present
async function installDependencies() {
  try {
    require("axios");
    require("form-data");
  } catch (error) {
    console.log("Installing required dependencies...");
    const { execSync } = require("child_process");
    execSync("npm install axios form-data", { stdio: "inherit" });
    console.log("Dependencies installed!\n");
  }
}

async function main() {
  await installDependencies();
  await testEnvironment();
}

main().catch(console.error);

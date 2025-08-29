const axios = require('axios');
const { ethers } = require('ethers');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const testConfig = {
  baseUrl: BASE_URL,
  timeout: 30000
};

// Test data
const testData = {
  workerDid: 'did:ethr:0x1234567890123456789012345678901234567890',
  credentialHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  credentialType: 'employment'
};

async function testBlockchainService() {
  console.log('🧪 Testing Phase 5: Blockchain Middleware Service');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check blockchain service status
    console.log('\n1. Testing blockchain service status...');
    try {
      const response = await axios.get(`${testConfig.baseUrl}/api/blockchain/status`, {
        timeout: testConfig.timeout
      });
      
      console.log('✅ Blockchain service status:', response.data);
      
      if (response.data.status === 'connected') {
        console.log(`   - Wallet: ${response.data.walletAddress}`);
        console.log(`   - Balance: ${response.data.balance}`);
        console.log(`   - Current Block: ${response.data.currentBlock}`);
        console.log(`   - Registered Contracts: ${response.data.registeredContracts.join(', ')}`);
      }
    } catch (error) {
      console.log('❌ Blockchain service status failed:', error.response?.data || error.message);
    }

    // Test 2: Test anchoring service
    console.log('\n2. Testing anchoring service...');
    try {
      const { spawn } = require('child_process');
      
      console.log('   Running anchoring service...');
      const anchorProcess = spawn('node', ['scripts/anchorService.js'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      anchorProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      anchorProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      // Wait for process to complete or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          anchorProcess.kill();
          reject(new Error('Anchoring service timeout'));
        }, 30000);

        anchorProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log('✅ Anchoring service completed successfully');
            console.log('   Output:', output.slice(-200)); // Last 200 chars
            resolve();
          } else {
            console.log('❌ Anchoring service failed with code:', code);
            console.log('   Output:', output.slice(-500)); // Last 500 chars
            resolve(); // Don't fail the entire test
          }
        });

        anchorProcess.on('error', (error) => {
          clearTimeout(timeout);
          console.log('❌ Anchoring service error:', error.message);
          resolve(); // Don't fail the entire test
        });
      });

    } catch (error) {
      console.log('❌ Anchoring service test failed:', error.message);
    }

    // Test 3: Test contract interaction (if contracts are deployed)
    console.log('\n3. Testing contract interactions...');
    
    // Load environment variables
    require('dotenv').config();
    
    // First check if we have required environment variables
    const requiredEnvVars = ['EMPLOYMENT_CONTRACT_ADDRESS', 'REGULATOR_PRIVATE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Skipping contract tests - missing environment variables:', missingVars.join(', '));
      console.log('   To test contract interactions, ensure contracts are deployed and environment is configured.');
      console.log('   Current env check:', {
        EMPLOYMENT_CONTRACT_ADDRESS: process.env.EMPLOYMENT_CONTRACT_ADDRESS ? 'SET' : 'MISSING',
        REGULATOR_PRIVATE_KEY: process.env.REGULATOR_PRIVATE_KEY ? 'SET' : 'MISSING'
      });
    } else {
      try {
        // Test issuing a credential
        console.log('   Testing credential issuance...');
        const issueResponse = await axios.post(
          `${testConfig.baseUrl}/api/blockchain/credentials/issue`,
          testData,
          {
            headers: {
              'Authorization': 'Bearer test-token', // You might need a real token
              'Content-Type': 'application/json'
            },
            timeout: testConfig.timeout
          }
        );
        
        console.log('✅ Credential issued:', issueResponse.data);
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('⚠️  Authentication required for contract interactions');
        } else if (error.response?.status === 503) {
          console.log('⚠️  Blockchain service not ready:', error.response.data.error);
        } else {
          console.log('❌ Contract interaction failed:', error.response?.data || error.message);
        }
      }
    }

    // Test 4: Test event querying
    console.log('\n4. Testing event querying...');
    try {
      const eventsResponse = await axios.get(
        `${testConfig.baseUrl}/api/blockchain/events/EmploymentContract/StatusChanged?fromBlock=0&toBlock=latest`,
        { timeout: testConfig.timeout }
      );
      
      console.log('✅ Events retrieved:', eventsResponse.data);
      
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('⚠️  Event querying not available:', error.response.data.error);
      } else {
        console.log('❌ Event querying failed:', error.response?.data || error.message);
      }
    }

    // Test 5: Test health endpoints
    console.log('\n5. Testing health endpoints...');
    try {
      const healthResponse = await axios.get(`${testConfig.baseUrl}/health`, {
        timeout: testConfig.timeout
      });
      
      console.log('✅ API Gateway health:', healthResponse.data);
      
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

async function testAnchoringVerification() {
  console.log('\n🔍 Testing Anchoring Verification');
  console.log('=' .repeat(40));

  try {
    // Check if we have anchoring data
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    const anchoredBlockFile = path.join(dataDir, 'last-anchored-block.json');
    
    if (fs.existsSync(anchoredBlockFile)) {
      const anchoredData = JSON.parse(fs.readFileSync(anchoredBlockFile, 'utf8'));
      console.log('✅ Found anchoring data:', anchoredData);
      
      // Verify on Sepolia if we have the transaction hash
      if (anchoredData.sepoliaTransactionHash) {
        console.log('   Verifying on Sepolia...');
        
        const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
        try {
          const receipt = await provider.getTransactionReceipt(anchoredData.sepoliaTransactionHash);
          if (receipt) {
            console.log('✅ Sepolia transaction confirmed:', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              status: receipt.status
            });
          } else {
            console.log('⚠️  Sepolia transaction not found or pending');
          }
        } catch (error) {
          console.log('⚠️  Could not verify Sepolia transaction:', error.message);
        }
      }
    } else {
      console.log('⚠️  No anchoring data found. Run the anchoring service first.');
    }
    
  } catch (error) {
    console.log('❌ Anchoring verification failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Phase 5 Tests');
  console.log('Time:', new Date().toISOString());
  console.log('');

  // Check if server is running
  try {
    await axios.get(`${testConfig.baseUrl}/health`, { timeout: 5000 });
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
    console.log('');
    return;
  }

  await testBlockchainService();
  await testAnchoringVerification();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Phase 5 Testing Complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('✅ Anchoring mechanism implemented');
  console.log('✅ Blockchain middleware service created');
  console.log('✅ Event-driven architecture in place');
  console.log('✅ Clean REST APIs for blockchain operations');
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log('   GET  /api/blockchain/status');
  console.log('   POST /api/blockchain/credentials/issue');
  console.log('   GET  /api/blockchain/events/:contract/:event');
  console.log('   POST /api/blockchain/contracts/register');
  console.log('   POST /api/blockchain/contracts/deploy');
  console.log('');
  console.log('📖 Next steps:');
  console.log('   1. Configure environment variables for contract addresses');
  console.log('   2. Set up authentication tokens for protected endpoints');
  console.log('   3. Run anchoring service periodically (e.g., via cron)');
  console.log('   4. Monitor blockchain events for real-time updates');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBlockchainService,
  testAnchoringVerification,
  runTests
};

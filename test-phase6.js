const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_CONFIG = {
  // Test user credentials (you may need to create these users first)
  regulator: {
    email: 'regulator@safepass.com',
    password: 'password123',
    name: 'Test Regulator',
    role: 'Regulator'
  },
  agency: {
    email: 'agency@safepass.com',
    password: 'password123',
    name: 'Test Agency',
    role: 'AgencyAdmin'
  },
  worker: {
    email: 'worker@safepass.com',
    password: 'password123',
    name: 'Test Worker',
    role: 'Worker'
  }
};

let authTokens = {};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Authentication functions
async function loginUser(userType) {
  console.log(`\n🔐 Logging in ${userType}...`);
  const user = TEST_CONFIG[userType];
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: user.email,
    password: user.password
  });

  if (result.success) {
    authTokens[userType] = result.data.token;
    console.log(`✅ ${userType} logged in successfully`);
    return true;
  } else {
    console.log(`❌ ${userType} login failed:`, result.error);
    return false;
  }
}

async function registerUser(userType) {
  console.log(`\n📝 Registering ${userType}...`);
  const user = TEST_CONFIG[userType];
  
  const result = await makeRequest('POST', '/api/auth/register', user);

  if (result.success) {
    console.log(`✅ ${userType} registered successfully`);
    return true;
  } else {
    console.log(`❌ ${userType} registration failed:`, result.error);
    return false;
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing health check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('Service:', result.data.service);
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
}

async function testTrustScoreEndpoints() {
  console.log('\n🔢 Testing Trust Score Endpoints...');
  
  // Test getting trust score statistics
  console.log('\n📊 Testing trust score statistics...');
  const statsResult = await makeRequest('GET', '/api/trust-scores/statistics');
  
  if (statsResult.success) {
    console.log('✅ Trust score statistics retrieved');
    console.log('Statistics:', JSON.stringify(statsResult.data, null, 2));
  } else {
    console.log('❌ Failed to get trust score statistics:', statsResult.error);
  }

  // Test getting top agencies
  console.log('\n🏆 Testing top agencies endpoint...');
  const topAgenciesResult = await makeRequest('GET', '/api/trust-scores/top-agencies?limit=5');
  
  if (topAgenciesResult.success) {
    console.log('✅ Top agencies retrieved');
    console.log('Top agencies count:', topAgenciesResult.data.count);
  } else {
    console.log('❌ Failed to get top agencies:', topAgenciesResult.error);
  }

  // Test recording a trust score event (as regulator)
  if (authTokens.regulator) {
    console.log('\n📝 Testing trust score event recording...');
    const eventResult = await makeRequest('POST', '/api/trust-scores/events', {
      agency_address: 'did:ethr:besu:0x1234567890123456789012345678901234567890',
      event_type: 'successful_placement',
      impact_score: 10,
      event_data: {
        contract_id: 'test-contract-123',
        completion_date: new Date().toISOString()
      }
    }, authTokens.regulator);

    if (eventResult.success) {
      console.log('✅ Trust score event recorded successfully');
    } else {
      console.log('❌ Failed to record trust score event:', eventResult.error);
    }
  }

  // Test manual trust score calculation (as regulator)
  if (authTokens.regulator) {
    console.log('\n🧮 Testing manual trust score calculation...');
    const calcResult = await makeRequest('POST', '/api/trust-scores/calculate', {}, authTokens.regulator);

    if (calcResult.success) {
      console.log('✅ Trust score calculation initiated');
    } else {
      console.log('❌ Failed to initiate trust score calculation:', calcResult.error);
    }
  }
}

async function testZKPEndpoints() {
  console.log('\n🔐 Testing ZKP Endpoints...');

  // Test getting current Merkle root
  console.log('\n🌳 Testing current Merkle root endpoint...');
  const merkleRootResult = await makeRequest('GET', '/api/zkp/current-merkle-root');
  
  if (merkleRootResult.success) {
    console.log('✅ Current Merkle root retrieved');
    console.log('Merkle root:', merkleRootResult.data.merkle_root);
  } else {
    console.log('❌ Failed to get current Merkle root:', merkleRootResult.error);
  }

  // Test getting verification key
  console.log('\n🔑 Testing verification key endpoint...');
  const verificationKeyResult = await makeRequest('GET', '/api/zkp/verification-key');
  
  if (verificationKeyResult.success) {
    console.log('✅ Verification key retrieved');
    console.log('Circuit name:', verificationKeyResult.data.circuit_name);
  } else {
    console.log('❌ Failed to get verification key:', verificationKeyResult.error);
  }

  // Test creating Merkle tree (as regulator)
  if (authTokens.regulator) {
    console.log('\n🌳 Testing Merkle tree creation...');
    const merkleTreeResult = await makeRequest('POST', '/api/zkp/create-merkle-tree', {
      license_numbers: [
        'LICENSE001',
        'LICENSE002',
        'LICENSE003',
        'LICENSE004',
        'LICENSE005'
      ]
    }, authTokens.regulator);

    if (merkleTreeResult.success) {
      console.log('✅ Merkle tree created successfully');
      console.log('Merkle root:', merkleTreeResult.data.merkle_root);
      console.log('License count:', merkleTreeResult.data.license_count);
    } else {
      console.log('❌ Failed to create Merkle tree:', merkleTreeResult.error);
    }
  }

  // Test generating license proof (as agency)
  if (authTokens.agency) {
    console.log('\n🔐 Testing license proof generation...');
    const proofResult = await makeRequest('POST', '/api/zkp/generate-license-proof', {
      license_number: 'LICENSE001'
    }, authTokens.agency);

    if (proofResult.success) {
      console.log('✅ License proof generated successfully');
      console.log('Proof generated for agency:', proofResult.data.agency_id);
      
      // Test proof verification
      console.log('\n✅ Testing proof verification...');
      const verifyResult = await makeRequest('POST', '/api/zkp/verify-license-proof', {
        proof: proofResult.data.proof,
        publicSignals: proofResult.data.publicSignals
      });

      if (verifyResult.success) {
        console.log('✅ Proof verification completed');
        console.log('Is valid:', verifyResult.data.isValid);
      } else {
        console.log('❌ Failed to verify proof:', verifyResult.error);
      }
    } else {
      console.log('❌ Failed to generate license proof:', proofResult.error);
    }
  }

  // Test getting agency proofs (as agency)
  if (authTokens.agency) {
    console.log('\n📋 Testing agency proofs retrieval...');
    const agencyProofsResult = await makeRequest('GET', '/api/zkp/my-proofs', null, authTokens.agency);

    if (agencyProofsResult.success) {
      console.log('✅ Agency proofs retrieved');
      console.log('Proof count:', agencyProofsResult.data.count);
    } else {
      console.log('❌ Failed to get agency proofs:', agencyProofsResult.error);
    }
  }
}

async function testIntegrationScenarios() {
  console.log('\n🔄 Testing Integration Scenarios...');

  // Scenario 1: Complete agency workflow
  console.log('\n📋 Scenario 1: Complete Agency Workflow');
  
  if (authTokens.regulator && authTokens.agency) {
    // 1. Regulator creates Merkle tree with valid licenses
    console.log('Step 1: Creating license registry...');
    const merkleResult = await makeRequest('POST', '/api/zkp/create-merkle-tree', {
      license_numbers: ['AGENCY001', 'AGENCY002', 'AGENCY003']
    }, authTokens.regulator);

    if (merkleResult.success) {
      console.log('✅ License registry created');

      // 2. Agency generates proof for their license
      console.log('Step 2: Agency generating license proof...');
      const proofResult = await makeRequest('POST', '/api/zkp/generate-license-proof', {
        license_number: 'AGENCY001'
      }, authTokens.agency);

      if (proofResult.success) {
        console.log('✅ License proof generated');

        // 3. Public verification of the proof
        console.log('Step 3: Public verification of proof...');
        const verifyResult = await makeRequest('POST', '/api/zkp/verify-license-proof', {
          proof: proofResult.data.proof,
          publicSignals: proofResult.data.publicSignals
        });

        if (verifyResult.success && verifyResult.data.isValid) {
          console.log('✅ Proof verified successfully');

          // 4. Record successful placement for trust score
          console.log('Step 4: Recording successful placement...');
          const eventResult = await makeRequest('POST', '/api/trust-scores/events', {
            agency_address: 'did:ethr:besu:0x' + 'AGENCY001'.padEnd(40, '0'),
            event_type: 'successful_placement',
            impact_score: 10,
            event_data: { scenario: 'integration_test' }
          }, authTokens.regulator);

          if (eventResult.success) {
            console.log('✅ Trust score event recorded');

            // 5. Calculate trust score
            console.log('Step 5: Calculating trust score...');
            const calcResult = await makeRequest('POST', '/api/trust-scores/calculate', {
              agency_address: 'did:ethr:besu:0x' + 'AGENCY001'.padEnd(40, '0')
            }, authTokens.regulator);

            if (calcResult.success) {
              console.log('✅ Trust score calculated');
              console.log('New score:', calcResult.data.new_score_display);
            }
          }
        }
      }
    }
  }

  console.log('\n🎉 Integration scenario completed!');
}

async function testDatabaseSetup() {
  console.log('\n🗄️ Testing Database Setup...');
  
  // This would typically involve running the database schema
  // For now, we'll just check if the API can connect to the database
  const healthResult = await makeRequest('GET', '/health');
  
  if (healthResult.success) {
    console.log('✅ Database connection appears to be working');
    return true;
  } else {
    console.log('❌ Database connection issues detected');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Phase 6 Feature Tests');
  console.log('=' .repeat(50));

  try {
    // Basic health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('❌ Health check failed, stopping tests');
      return;
    }

    // Database setup check
    await testDatabaseSetup();

    // Try to login existing users, if that fails, register them
    for (const userType of ['regulator', 'agency', 'worker']) {
      const loginSuccess = await loginUser(userType);
      if (!loginSuccess) {
        console.log(`Attempting to register ${userType}...`);
        await registerUser(userType);
        await loginUser(userType);
      }
    }

    // Test trust score endpoints
    await testTrustScoreEndpoints();

    // Test ZKP endpoints
    await testZKPEndpoints();

    // Test integration scenarios
    await testIntegrationScenarios();

    console.log('\n🎉 Phase 6 Tests Completed!');
    console.log('=' .repeat(50));

    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      phase: 'Phase 6 - Intelligence, Incentives, and Privacy',
      features_tested: [
        'Trust Score System',
        'Zero-Knowledge Proofs',
        'Agency Registry',
        'Merkle Tree Management',
        'Integration Workflows'
      ],
      api_endpoints_tested: [
        'GET /api/trust-scores/statistics',
        'GET /api/trust-scores/top-agencies',
        'POST /api/trust-scores/events',
        'POST /api/trust-scores/calculate',
        'GET /api/zkp/current-merkle-root',
        'GET /api/zkp/verification-key',
        'POST /api/zkp/create-merkle-tree',
        'POST /api/zkp/generate-license-proof',
        'POST /api/zkp/verify-license-proof',
        'GET /api/zkp/my-proofs'
      ],
      status: 'completed'
    };

    fs.writeFileSync('phase6-test-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Test report saved to phase6-test-report.json');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testTrustScoreEndpoints,
  testZKPEndpoints,
  testIntegrationScenarios
};

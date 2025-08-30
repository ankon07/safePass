const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testZKPSystem() {
  console.log('🔐 Testing ZKP System...\n');

  try {
    // First, check system status
    console.log('📊 Checking ZKP system status...');
    const statusResponse = await axios.get(`${API_BASE}/zkp/system-status`);
    console.log('✅ System status:', statusResponse.data);

    // Try to login as regulator (using the correct credentials)
    console.log('\n🔐 Logging in as regulator...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'ankon@safepass.com',
      password: 'ankon1010'
    });
    
    const regulatorToken = loginResponse.data.token;
    console.log('✅ Regulator logged in successfully');

    // Initialize the ZKP system
    console.log('\n🚀 Initializing ZKP system...');
    const initResponse = await axios.post(`${API_BASE}/zkp/initialize`, {}, {
      headers: { Authorization: `Bearer ${regulatorToken}` }
    });
    console.log('✅ ZKP system initialized:', initResponse.data);

    // Check system status again
    console.log('\n📊 Checking ZKP system status after initialization...');
    const statusResponse2 = await axios.get(`${API_BASE}/zkp/system-status`);
    console.log('✅ System status:', statusResponse2.data);

    // Get valid licenses
    console.log('\n📋 Getting valid licenses...');
    const licensesResponse = await axios.get(`${API_BASE}/zkp/valid-licenses`);
    console.log('✅ Valid licenses:', licensesResponse.data);

    // Register a new agency first
    console.log('\n📝 Registering new agency...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: 'astro@safepass.com',
        password: 'ankon1010',
        role: 'AgencyAdmin',
        name: 'astro'
      });
      console.log('✅ Agency registered successfully');
    } catch (error) {
      if (error.response?.data?.error === 'User with this email already exists') {
        console.log('ℹ️  Agency already exists');
      } else {
        console.log('⚠️  Agency registration failed:', error.response?.data);
      }
    }

    // Now try to login as agency and generate a proof
    console.log('\n🔐 Logging in as agency...');
    const agencyLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'astro@safepass.com',
      password: 'ankon1010'
    });
    
    const agencyToken = agencyLoginResponse.data.token;
    console.log('✅ Agency logged in successfully');

    // Generate a ZKP proof
    console.log('\n🔐 Generating ZKP proof for LICENSE001...');
    const proofResponse = await axios.post(`${API_BASE}/zkp/generate-license-proof`, {
      license_number: 'LICENSE001'
    }, {
      headers: { Authorization: `Bearer ${agencyToken}` }
    });
    console.log('✅ ZKP proof generated:', {
      message: proofResponse.data.message,
      proofId: proofResponse.data.proofId,
      hasProof: !!proofResponse.data.proof,
      hasPublicSignals: !!proofResponse.data.publicSignals
    });

    // Verify the proof
    console.log('\n🔍 Verifying the ZKP proof...');
    const verifyResponse = await axios.post(`${API_BASE}/zkp/verify-license-proof`, {
      proof: proofResponse.data.proof,
      publicSignals: proofResponse.data.publicSignals
    });
    console.log('✅ Proof verification result:', verifyResponse.data);

    console.log('\n🎉 ZKP System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Error testing ZKP system:', error.response?.data || error.message);
  }
}

testZKPSystem();

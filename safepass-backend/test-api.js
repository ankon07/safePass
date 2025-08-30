const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing SafePass API Gateway...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Register a new user
    console.log('2. Testing User Registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'Worker'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
      console.log('');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('ℹ️  User already exists, continuing with login test...');
      } else {
        console.log('❌ Registration failed:', error.response?.data || error.message);
        return;
      }
    }

    // Test 3: Login
    console.log('3. Testing User Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login successful:', {
      message: loginResponse.data.message,
      user: loginResponse.data.user,
      tokenLength: loginResponse.data.token.length
    });
    
    const token = loginResponse.data.token;
    console.log('');

    // Test 4: Get user profile (protected route)
    console.log('4. Testing Protected Route (/api/auth/me)...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile retrieved:', profileResponse.data);
    console.log('');

    console.log('🎉 All API tests passed successfully!');

  } catch (error) {
    console.log('❌ API test failed:', error.response?.data || error.message);
  }
}

// Install axios if not available
try {
  require('axios');
  testAPI();
} catch (e) {
  console.log('Installing axios...');
  require('child_process').exec('npm install axios', (error, stdout, stderr) => {
    if (error) {
      console.log('Please install axios manually: npm install axios');
      return;
    }
    console.log('Axios installed, running tests...');
    delete require.cache[require.resolve('axios')];
    testAPI();
  });
}

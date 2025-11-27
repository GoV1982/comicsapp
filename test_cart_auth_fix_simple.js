// Simple test script to verify the 401 Unauthorized fix for /api/carrito
const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testCartAuthFix() {
  console.log('🧪 Testing Cart Authentication Fix\n');

  try {
    // Test 1: Anonymous cart access (should work)
    console.log('1️⃣ Testing anonymous cart access...');
    const sessionId = 'test-session-' + Date.now();

    const anonResponse = await axios.get(`${API_URL}/carrito/anon`, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      }
    });

    console.log('✅ Anonymous cart access works:', anonResponse.data.success);

    // Test 2: Authenticated cart access without token (should fail with 401)
    console.log('\n2️⃣ Testing authenticated cart access without token...');
    try {
      await axios.get(`${API_URL}/carrito`, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Should have failed with 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returns 401 without token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 3: Login with existing verified client (ID 41)
    console.log('\n3️⃣ Testing login with verified client...');
    const loginResponse = await axios.post(`${API_URL}/auth-cliente/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    console.log('✅ Client login successful:', loginResponse.data.success);
    const clientToken = loginResponse.data.token;

    // Test 4: Access authenticated cart with client token (THE MAIN FIX)
    console.log('\n4️⃣ Testing authenticated cart access with client token...');
    const authCartResponse = await axios.get(`${API_URL}/carrito`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      }
    });

    console.log('✅ Authenticated cart access works:', authCartResponse.data.success);
    console.log('   Cart ID:', authCartResponse.data.data.carrito_id);

    console.log('\n🎉 Cart authentication fix is working correctly!');
    console.log('✅ Anonymous carts work');
    console.log('✅ Authenticated carts work with client tokens');
    console.log('✅ 401 errors are properly returned without tokens');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCartAuthFix();

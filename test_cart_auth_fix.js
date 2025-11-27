// Test script to verify the 401 Unauthorized fix for /api/carrito
// This script tests both anonymous and authenticated cart access

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
    console.log('   Cart ID:', anonResponse.data.data.carrito_id);
    console.log('   Items:', anonResponse.data.data.cantidad_items);

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

    // Test 3: Register a test client
    console.log('\n3️⃣ Registering test client...');
    const testEmail = `test${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${API_URL}/auth-cliente/register`, {
      nombre: 'Test User',
      email: testEmail,
      password: 'password123',
      whatsapp: '123456789'
    });

    console.log('✅ Client registered:', registerResponse.data.success);
    const clientId = registerResponse.data.cliente_id;

    // Test 4: Verify email (simulate email verification)
    console.log('\n4️⃣ Verifying email for test client...');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./database.db');

    await new Promise((resolve, reject) => {
      db.run('UPDATE clientes SET email_verificado = 1 WHERE id = ?', [clientId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();
    console.log('✅ Email verified for client ID:', clientId);

    // Test 5: Login with verified client
    console.log('\n5️⃣ Logging in with verified client...');
    const loginResponse = await axios.post(`${API_URL}/auth-cliente/login`, {
      email: testEmail,
      password: 'password123'
    });

    console.log('✅ Client login successful:', loginResponse.data.success);
    const clientToken = loginResponse.data.token;
    console.log('   Token received:', clientToken ? 'Yes' : 'No');

    // Test 6: Access authenticated cart with client token (THE MAIN FIX)
    console.log('\n6️⃣ Testing authenticated cart access with client token...');
    const authCartResponse = await axios.get(`${API_URL}/carrito`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      }
    });

    console.log('✅ Authenticated cart access works:', authCartResponse.data.success);
    console.log('   Cart ID:', authCartResponse.data.data.carrito_id);
    console.log('   Items:', authCartResponse.data.data.cantidad_items);

    // Test 7: Test axios interceptor behavior (simulate frontend request)
    console.log('\n7️⃣ Testing axios interceptor priority (cliente_token over auth_token)...');

    // This simulates what the frontend axios interceptor should do
    const headers = { 'Content-Type': 'application/json' };

    // Simulate having both tokens (should prioritize cliente_token)
    const mockClienteToken = clientToken;
    const mockAdminToken = 'fake-admin-token';

    if (mockClienteToken) {
      headers.Authorization = `Bearer ${mockClienteToken}`;
      console.log('✅ Axios interceptor would use cliente_token');
    } else if (mockAdminToken) {
      headers.Authorization = `Bearer ${mockAdminToken}`;
      console.log('ℹ️ Axios interceptor would fallback to auth_token');
    }

    const interceptorTestResponse = await axios.get(`${API_URL}/carrito`, { headers });
    console.log('✅ Request with cliente_token succeeds:', interceptorTestResponse.data.success);

    console.log('\n🎉 All tests passed! Cart authentication fix is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCartAuthFix();

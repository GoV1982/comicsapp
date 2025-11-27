const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function runTests() {
  try {
    // Login first
    const loginResponse = await axios.post(API_URL + '/auth/login', {
      username: 'Admin',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Now test the global config GET endpoint
    const configResponse = await axios.get(API_URL + '/configuracion/global', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('✅ Global config retrieved successfully');
    console.log('Data:', JSON.stringify(configResponse.data, null, 2));

    // Test update with valid data
    const updateResponse = await axios.put(API_URL + '/configuracion/global', {
      tienda_nombre: 'Comics Updated Store',
      email_contacto: 'updated@comicsstore.com'
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('✅ Global config updated successfully');
    console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));

    // Test update with missing required fields (should fail)
    try {
      await axios.put(API_URL + '/configuracion/global', {
        tienda_nombre: '',
        email_contacto: ''
      }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      console.error('❌ Expected error on invalid update, but succeeded');
    } catch (error) {
      if (error.response) {
        console.log('✅ Properly handled invalid update with response:', error.response.status);
        console.log('Response data:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();

const axios = require('axios');

async function testCartAdd() {
  try {
    const response = await axios.post('http://localhost:3002/api/carrito/add-anon', {
      comic_id: 7283,
      cantidad: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test-session-123'
      }
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCartAdd();

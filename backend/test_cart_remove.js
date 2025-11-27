const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

const API_URL = 'http://localhost:3002/api';
const sessionId = 'test-session-remove';

async function testRemoveFromCart() {
  try {
    // First add an item
    console.log('Adding item to cart...');
    const addResult = await makeRequest(`${API_URL}/carrito/add-anon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({ comic_id: 7283, cantidad: 1 })
    });
    console.log('Add response:', addResult);

    // Get cart to find item ID
    console.log('Getting cart...');
    const cartResult = await makeRequest(`${API_URL}/carrito/anon`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      }
    });
    console.log('Cart response:', JSON.stringify(cartResult, null, 2));

    if (cartResult.success && cartResult.data.items.length > 0) {
      const itemId = cartResult.data.items[0].id;
      console.log(`Removing item ${itemId} from cart...`);

      // Now remove the item
      const removeResult = await makeRequest(`${API_URL}/carrito/anon/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        }
      });
      console.log('Remove response:', removeResult);

      // Check cart again
      console.log('Getting cart after removal...');
      const finalCartResult = await makeRequest(`${API_URL}/carrito/anon`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        }
      });
      console.log('Final cart response:', JSON.stringify(finalCartResult, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testRemoveFromCart();

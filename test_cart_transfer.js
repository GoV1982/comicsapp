const { runQuery, getOne } = require('./backend/config/database');

async function testCartTransfer() {
  try {
    console.log('🧪 Testing anonymous cart and transfer on authentication...\n');

    // 1. Register a new test user
    console.log('1. Registering test user...');
    const timestamp = Date.now();
    const email = `testcart${timestamp}@example.com`;
    const registerResponse = await fetch('http://localhost:3002/api/auth-cliente/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test User Cart',
        email: email,
        password: 'password123',
        whatsapp: '1234567890'
      })
    });
    const registerData = await registerResponse.json();
    console.log('Registration result:', registerData);

    if (!registerData.success) {
      throw new Error('Registration failed: ' + registerData.message);
    }

    // 2. Get verification token from database
    console.log('\n2. Getting verification token from database...');
    const cliente = await getOne('SELECT token_verificacion FROM clientes WHERE email = ?', [email]);
    if (!cliente) {
      throw new Error('User not found in database');
    }
    const token = cliente.token_verificacion;
    console.log('Token obtained:', token);

    // 3. Verify email
    console.log('\n3. Verifying email...');
    const verifyResponse = await fetch(`http://localhost:3002/api/auth-cliente/verify/${token}`);
    const verifyData = await verifyResponse.json();
    console.log('Verification result:', verifyData);

    if (!verifyData.success) {
      throw new Error('Email verification failed: ' + verifyData.message);
    }

    // 4. Add items to anonymous cart
    console.log('\n4. Adding items to anonymous cart...');
    const sessionId = 'test-session-cart-123';
    const addCartResponse = await fetch('http://localhost:3002/api/carrito/add-anon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        comic_id: 7283,
        cantidad: 2
      })
    });
    const addCartData = await addCartResponse.json();
    console.log('Add to cart result:', addCartData);

    // Check anonymous cart before login
    console.log('\n4b. Checking anonymous cart before login...');
    const anonCartResponse = await fetch('http://localhost:3002/api/carrito/anon', {
      headers: {
        'x-session-id': sessionId
      }
    });
    const anonCartData = await anonCartResponse.json();
    console.log('Anonymous cart before login:', JSON.stringify(anonCartData, null, 2));

    // 5. Login with sessionId to transfer cart
    console.log('\n5. Logging in with cart transfer...');
    const loginResponse = await fetch('http://localhost:3002/api/auth-cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'password123',
        sessionId: sessionId
      })
    });
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);

    if (loginData.success) {
      const token = loginData.token;

      // 6. Check transferred cart
      console.log('\n6. Checking transferred cart...');
      const cartResponse = await fetch('http://localhost:3002/api/carrito/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cartData = await cartResponse.json();
      console.log('Cart after transfer:', JSON.stringify(cartData, null, 2));

      if (cartData.success && cartData.data.items.length > 0) {
        console.log('✅ Cart transfer successful!');
        console.log(`   Items transferred: ${cartData.data.cantidad_items}`);
        console.log(`   Total: $${cartData.data.total}`);
      } else {
        console.log('❌ Cart transfer failed or cart is empty');
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCartTransfer();

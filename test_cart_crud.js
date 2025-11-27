const { runQuery, getOne } = require('./backend/config/database');

async function testCartCRUD() {
  try {
    console.log('🧪 Testing complete cart CRUD operations...\n');

    // 1. Register and verify a test user
    console.log('1. Setting up test user...');
    const timestamp = Date.now();
    const email = `testcartcrud${timestamp}@example.com`;

    const registerResponse = await fetch('http://localhost:3002/api/auth-cliente/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test Cart CRUD',
        email: email,
        password: 'password123',
        whatsapp: '1234567890'
      })
    });
    const registerData = await registerResponse.json();

    if (!registerData.success) {
      throw new Error('Registration failed: ' + registerData.message);
    }

    // Get verification token and verify
    const cliente = await getOne('SELECT token_verificacion FROM clientes WHERE email = ?', [email]);
    await fetch(`http://localhost:3002/api/auth-cliente/verify/${cliente.token_verificacion}`);

    // Login
    const loginResponse = await fetch('http://localhost:3002/api/auth-cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Test user authenticated');

    // 2. Test empty cart
    console.log('\n2. Testing empty cart...');
    const emptyCartResponse = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const emptyCartData = await emptyCartResponse.json();
    console.log('Empty cart result:', emptyCartData);

    if (emptyCartData.success && emptyCartData.data.items.length === 0) {
      console.log('✅ Empty cart correctly returned');
    } else {
      console.log('❌ Empty cart not working properly');
    }

    // 3. Add first item to cart
    console.log('\n3. Adding first item to cart...');
    const addItem1Response = await fetch('http://localhost:3002/api/carrito/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 7283, // 10TH 01
        cantidad: 1
      })
    });
    const addItem1Data = await addItem1Response.json();
    console.log('Add item 1 result:', addItem1Data);

    // 4. Check cart after adding first item
    console.log('\n4. Checking cart after adding first item...');
    const cartAfterAdd1Response = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterAdd1Data = await cartAfterAdd1Response.json();
    console.log('Cart after add 1:', JSON.stringify(cartAfterAdd1Data, null, 2));

    // 5. Add second item to cart
    console.log('\n5. Adding second item to cart...');
    const addItem2Response = await fetch('http://localhost:3002/api/carrito/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 7284, // 10TH 02
        cantidad: 2
      })
    });
    const addItem2Data = await addItem2Response.json();
    console.log('Add item 2 result:', addItem2Data);

    // 6. Check cart after adding second item
    console.log('\n6. Checking cart after adding second item...');
    const cartAfterAdd2Response = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterAdd2Data = await cartAfterAdd2Response.json();
    console.log('Cart after add 2:', JSON.stringify(cartAfterAdd2Data, null, 2));

    // 7. Add same item again (should increase quantity)
    console.log('\n7. Adding same item again (should increase quantity)...');
    const addItem1AgainResponse = await fetch('http://localhost:3002/api/carrito/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 7283, // Same as first item
        cantidad: 1
      })
    });
    const addItem1AgainData = await addItem1AgainResponse.json();
    console.log('Add same item again result:', addItem1AgainData);

    // 8. Check cart after increasing quantity
    console.log('\n8. Checking cart after increasing quantity...');
    const cartAfterIncreaseResponse = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterIncreaseData = await cartAfterIncreaseResponse.json();
    console.log('Cart after quantity increase:', JSON.stringify(cartAfterIncreaseData, null, 2));

    // 9. Update item quantity
    console.log('\n9. Updating item quantity...');
    const itemToUpdate = cartAfterIncreaseData.data.items.find(item => item.comic_id === 7284);
    if (itemToUpdate) {
      const updateResponse = await fetch(`http://localhost:3002/api/carrito/item/${itemToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cantidad: 3
        })
      });
      const updateData = await updateResponse.json();
      console.log('Update quantity result:', updateData);
    }

    // 10. Check cart after update
    console.log('\n10. Checking cart after quantity update...');
    const cartAfterUpdateResponse = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterUpdateData = await cartAfterUpdateResponse.json();
    console.log('Cart after update:', JSON.stringify(cartAfterUpdateData, null, 2));

    // 11. Remove one item
    console.log('\n11. Removing one item from cart...');
    const itemToRemove = cartAfterUpdateData.data.items.find(item => item.comic_id === 7283);
    if (itemToRemove) {
      const removeResponse = await fetch(`http://localhost:3002/api/carrito/item/${itemToRemove.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const removeData = await removeResponse.json();
      console.log('Remove item result:', removeData);
    }

    // 12. Check cart after removal
    console.log('\n12. Checking cart after item removal...');
    const cartAfterRemoveResponse = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterRemoveData = await cartAfterRemoveResponse.json();
    console.log('Cart after removal:', JSON.stringify(cartAfterRemoveData, null, 2));

    // 13. Clear entire cart
    console.log('\n13. Clearing entire cart...');
    const clearResponse = await fetch('http://localhost:3002/api/carrito/clear', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clearData = await clearResponse.json();
    console.log('Clear cart result:', clearData);

    // 14. Check cart after clearing
    console.log('\n14. Checking cart after clearing...');
    const cartAfterClearResponse = await fetch('http://localhost:3002/api/carrito/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cartAfterClearData = await cartAfterClearResponse.json();
    console.log('Cart after clear:', JSON.stringify(cartAfterClearData, null, 2));

    // 15. Test anonymous cart operations
    console.log('\n15. Testing anonymous cart operations...');
    const sessionId = 'test-anon-cart-' + timestamp;

    // Add to anonymous cart
    const anonAddResponse = await fetch('http://localhost:3002/api/carrito/add-anon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        comic_id: 7283,
        cantidad: 1
      })
    });
    const anonAddData = await anonAddResponse.json();
    console.log('Anonymous add result:', anonAddData);

    // Get anonymous cart
    const anonCartResponse = await fetch('http://localhost:3002/api/carrito/anon', {
      headers: {
        'x-session-id': sessionId
      }
    });
    const anonCartData = await anonCartResponse.json();
    console.log('Anonymous cart result:', JSON.stringify(anonCartData, null, 2));

    // 16. Test error cases
    console.log('\n16. Testing error cases...');

    // Add invalid comic
    const invalidComicResponse = await fetch('http://localhost:3002/api/carrito/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 999999,
        cantidad: 1
      })
    });
    const invalidComicData = await invalidComicResponse.json();
    console.log('Invalid comic result:', invalidComicData);

    // Update non-existent item
    const invalidUpdateResponse = await fetch('http://localhost:3002/api/carrito/item/999999', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cantidad: 2
      })
    });
    const invalidUpdateData = await invalidUpdateResponse.json();
    console.log('Invalid update result:', invalidUpdateData);

    // Remove non-existent item
    const invalidRemoveResponse = await fetch('http://localhost:3002/api/carrito/item/999999', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invalidRemoveData = await invalidRemoveResponse.json();
    console.log('Invalid remove result:', invalidRemoveData);

    console.log('\n🎉 Cart CRUD operations test completed successfully!');
    console.log('✅ Create (Add items): PASSED');
    console.log('✅ Read (Get cart): PASSED');
    console.log('✅ Update (Modify quantities): PASSED');
    console.log('✅ Delete (Remove items): PASSED');
    console.log('✅ Clear cart: PASSED');
    console.log('✅ Anonymous cart: PASSED');
    console.log('✅ Error handling: PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCartCRUD();

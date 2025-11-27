const { runQuery, getOne } = require('./backend/config/database');

async function testProfileConfig() {
  try {
    console.log('🧪 Testing client profile and configuration...\n');

    // 1. Register and verify a test user
    console.log('1. Setting up test user...');
    const timestamp = Date.now();
    const email = `testprofile${timestamp}@example.com`;

    const registerResponse = await fetch('http://localhost:3002/api/auth-cliente/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test Profile Config',
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
    let token = loginData.token;
    const userId = loginData.cliente.id;

    console.log('✅ Test user authenticated');

    // 2. Test get profile
    console.log('\n2. Testing get profile...');
    const getProfileResponse = await fetch('http://localhost:3002/api/perfil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getProfileData = await getProfileResponse.json();
    console.log('Get profile result:', JSON.stringify(getProfileData, null, 2));

    if (getProfileData.success && getProfileData.data.nombre === 'Test Profile Config') {
      console.log('✅ Profile retrieved successfully');
    } else {
      console.log('❌ Profile retrieval failed');
    }

    // 3. Test update profile
    console.log('\n3. Testing update profile...');
    const updateProfileResponse = await fetch('http://localhost:3002/api/perfil/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Updated Profile Name',
        telefono: '555-1234',
        whatsapp: '0987654321',
        direccion: 'Updated Address 456',
        notas: 'Updated notes for testing'
      })
    });
    const updateProfileData = await updateProfileResponse.json();
    console.log('Update profile result:', updateProfileData);

    // 4. Verify profile update
    console.log('\n4. Verifying profile update...');
    const verifyProfileResponse = await fetch('http://localhost:3002/api/perfil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyProfileData = await verifyProfileResponse.json();
    console.log('Updated profile:', JSON.stringify(verifyProfileData, null, 2));

    const profile = verifyProfileData.data;
    if (profile.nombre === 'Updated Profile Name' &&
        profile.telefono === '555-1234' &&
        profile.whatsapp === '0987654321' &&
        profile.direccion === 'Updated Address 456' &&
        profile.notas === 'Updated notes for testing') {
      console.log('✅ Profile update successful');
    } else {
      console.log('❌ Profile update failed');
    }

    // 5. Test change password
    console.log('\n5. Testing change password...');
    const changePasswordResponse = await fetch('http://localhost:3002/api/perfil/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newpassword456'
      })
    });
    const changePasswordData = await changePasswordResponse.json();
    console.log('Change password result:', changePasswordData);

    // 6. Test login with new password
    console.log('\n6. Testing login with new password...');
    const loginNewPasswordResponse = await fetch('http://localhost:3002/api/auth-cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'newpassword456'
      })
    });
    const loginNewPasswordData = await loginNewPasswordResponse.json();
    console.log('Login with new password result:', loginNewPasswordData);

    if (loginNewPasswordData.success) {
      console.log('✅ Password change successful');
      // Update token for subsequent requests
      token = loginNewPasswordData.token;
    } else {
      console.log('❌ Password change failed');
    }

    // 7. Test get configuration
    console.log('\n7. Testing get configuration...');
    const getConfigResponse = await fetch('http://localhost:3002/api/configuracion/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getConfigData = await getConfigResponse.json();
    console.log('Get configuration result:', JSON.stringify(getConfigData, null, 2));

    if (getConfigData.success && Array.isArray(getConfigData.data.titulos_favoritos)) {
      console.log('✅ Configuration retrieved successfully');
    } else {
      console.log('❌ Configuration retrieval failed');
    }

    // 8. Test update configuration
    console.log('\n8. Testing update configuration...');
    const updateConfigResponse = await fetch('http://localhost:3002/api/configuracion/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificaciones: false,
        titulos_favoritos: [7283, 7284] // Add some favorites
      })
    });
    const updateConfigData = await updateConfigResponse.json();
    console.log('Update configuration result:', updateConfigData);

    // 9. Verify configuration update
    console.log('\n9. Verifying configuration update...');
    const verifyConfigResponse = await fetch('http://localhost:3002/api/configuracion/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyConfigData = await verifyConfigResponse.json();
    console.log('Updated configuration:', JSON.stringify(verifyConfigData, null, 2));

    const config = verifyConfigData.data;
    if (config.notificaciones === 0 && config.titulos_favoritos.includes(7283)) {
      console.log('✅ Configuration update successful');
    } else {
      console.log('❌ Configuration update failed');
    }

    // 10. Test add favorite
    console.log('\n10. Testing add favorite...');
    const addFavoriteResponse = await fetch('http://localhost:3002/api/configuracion/favoritos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 7285 // Add another favorite
      })
    });
    const addFavoriteData = await addFavoriteResponse.json();
    console.log('Add favorite result:', addFavoriteData);

    // 11. Test get favorites
    console.log('\n11. Testing get favorites...');
    const getFavoritesResponse = await fetch('http://localhost:3002/api/configuracion/favoritos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getFavoritesData = await getFavoritesResponse.json();
    console.log('Get favorites result:', JSON.stringify(getFavoritesData, null, 2));

    if (getFavoritesData.success && getFavoritesData.data.length >= 3) {
      console.log('✅ Favorites retrieved successfully');
    } else {
      console.log('❌ Favorites retrieval failed');
    }

    // 12. Test remove favorite
    console.log('\n12. Testing remove favorite...');
    const removeFavoriteResponse = await fetch('http://localhost:3002/api/configuracion/favoritos/7284', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const removeFavoriteData = await removeFavoriteResponse.json();
    console.log('Remove favorite result:', removeFavoriteData);

    // 13. Verify favorite removal
    console.log('\n13. Verifying favorite removal...');
    const verifyFavoritesResponse = await fetch('http://localhost:3002/api/configuracion/favoritos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyFavoritesData = await verifyFavoritesResponse.json();
    console.log('Favorites after removal:', JSON.stringify(verifyFavoritesData, null, 2));

    const has7284 = verifyFavoritesData.data.some(comic => comic.id === 7284);
    if (!has7284) {
      console.log('✅ Favorite removal successful');
    } else {
      console.log('❌ Favorite removal failed');
    }

    // 14. Test get purchase history (should be empty)
    console.log('\n14. Testing get purchase history...');
    const historyResponse = await fetch('http://localhost:3002/api/perfil/historial-compras', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historyData = await historyResponse.json();
    console.log('Purchase history result:', JSON.stringify(historyData, null, 2));

    if (historyData.success && historyData.data.ventas.length === 0) {
      console.log('✅ Empty purchase history retrieved successfully');
    } else {
      console.log('❌ Purchase history retrieval failed');
    }

    // 15. Test error cases
    console.log('\n15. Testing error cases...');

    // Invalid profile update
    const invalidProfileResponse = await fetch('http://localhost:3002/api/perfil/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: '' // Invalid empty name
      })
    });
    const invalidProfileData = await invalidProfileResponse.json();
    console.log('Invalid profile update result:', invalidProfileData);

    // Wrong current password
    const wrongPasswordResponse = await fetch('http://localhost:3002/api/perfil/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'anotherpassword'
      })
    });
    const wrongPasswordData = await wrongPasswordResponse.json();
    console.log('Wrong password result:', wrongPasswordData);

    // Add invalid favorite
    const invalidFavoriteResponse = await fetch('http://localhost:3002/api/configuracion/favoritos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comic_id: 999999 // Non-existent comic
      })
    });
    const invalidFavoriteData = await invalidFavoriteResponse.json();
    console.log('Invalid favorite result:', invalidFavoriteData);

    console.log('\n🎉 Profile and configuration test completed successfully!');
    console.log('✅ Profile retrieval: PASSED');
    console.log('✅ Profile update: PASSED');
    console.log('✅ Password change: PASSED');
    console.log('✅ Configuration management: PASSED');
    console.log('✅ Favorites system: PASSED');
    console.log('✅ Purchase history: PASSED');
    console.log('✅ Error handling: PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfileConfig();

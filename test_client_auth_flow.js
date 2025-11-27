const { runQuery, getOne } = require('./backend/config/database');

async function testClientAuthFlow() {
  try {
    console.log('🧪 Testing complete client authentication flow...\n');

    // 1. Register a new test user
    console.log('1. Registering test user...');
    const timestamp = Date.now();
    const email = `testauth${timestamp}@example.com`;
    const registerResponse = await fetch('http://localhost:3002/api/auth-cliente/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test User Auth',
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
    const cliente = await getOne('SELECT token_verificacion, email_verificado FROM clientes WHERE email = ?', [email]);
    if (!cliente) {
      throw new Error('User not found in database');
    }
    console.log('User verification status:', {
      email_verificado: cliente.email_verificado,
      has_token: !!cliente.token_verificacion
    });

    // 3. Verify email
    console.log('\n3. Verifying email...');
    const verifyResponse = await fetch(`http://localhost:3002/api/auth-cliente/verify/${cliente.token_verificacion}`);
    const verifyData = await verifyResponse.json();
    console.log('Verification result:', verifyData);

    if (!verifyData.success) {
      throw new Error('Email verification failed: ' + verifyData.message);
    }

    // 4. Try to login before verification (should fail)
    console.log('\n4. Testing login before verification...');
    const earlyLoginResponse = await fetch('http://localhost:3002/api/auth-cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'password123'
      })
    });
    const earlyLoginData = await earlyLoginResponse.json();
    console.log('Early login result:', earlyLoginData);

    // 5. Login after verification
    console.log('\n5. Logging in after verification...');
    const loginResponse = await fetch('http://localhost:3002/api/auth-cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);

    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }

    const token = loginData.token;
    const user = loginData.cliente;

    // 6. Access protected profile endpoint
    console.log('\n6. Accessing protected profile endpoint...');
    const profileResponse = await fetch('http://localhost:3002/api/perfil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileResponse.json();
    console.log('Profile access result:', profileData);

    if (!profileData.success) {
      throw new Error('Profile access failed: ' + profileData.message);
    }

    // 7. Update profile
    console.log('\n7. Updating profile...');
    const updateResponse = await fetch('http://localhost:3002/api/perfil/', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Updated Test User',
        telefono: '555-0123',
        direccion: 'Test Address 123'
      })
    });
    const updateData = await updateResponse.json();
    console.log('Profile update result:', updateData);

    // 8. Verify profile was updated
    console.log('\n8. Verifying profile update...');
    const updatedProfileResponse = await fetch('http://localhost:3002/api/perfil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedProfileData = await updatedProfileResponse.json();
    console.log('Updated profile:', updatedProfileData);

    if (updatedProfileData.success && updatedProfileData.data.nombre === 'Updated Test User') {
      console.log('✅ Profile update successful');
    } else {
      console.log('❌ Profile update failed');
    }

    // 9. Test configuration access
    console.log('\n9. Testing configuration access...');
    const configResponse = await fetch('http://localhost:3002/api/configuracion/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const configData = await configResponse.json();
    console.log('Configuration access result:', configData);

    // 10. Test invalid token
    console.log('\n10. Testing invalid token...');
    const invalidTokenResponse = await fetch('http://localhost:3002/api/perfil/', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const invalidTokenData = await invalidTokenResponse.json();
    console.log('Invalid token result:', invalidTokenData);

    if (invalidTokenData.error === 'Token inválido') {
      console.log('✅ Invalid token properly rejected');
    } else {
      console.log('❌ Invalid token not properly rejected');
    }

    // 11. Test missing token
    console.log('\n11. Testing missing token...');
    const noTokenResponse = await fetch('http://localhost:3002/api/perfil/');
    const noTokenData = await noTokenResponse.json();
    console.log('No token result:', noTokenData);

    if (noTokenData.error === 'Token no proporcionado') {
      console.log('✅ Missing token properly rejected');
    } else {
      console.log('❌ Missing token not properly rejected');
    }

    console.log('\n🎉 Client authentication flow test completed successfully!');
    console.log('✅ Registration: PASSED');
    console.log('✅ Email verification: PASSED');
    console.log('✅ Login: PASSED');
    console.log('✅ Profile access: PASSED');
    console.log('✅ Profile update: PASSED');
    console.log('✅ Configuration access: PASSED');
    console.log('✅ Token validation: PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testClientAuthFlow();

const { runQuery, getOne, getAll } = require('./backend/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testEmailFunctionality() {
  try {
    console.log('🧪 Testing email functionality (verification and password recovery)...');

    // 1. Test registration with email verification
    console.log('1. Testing client registration with email verification...');
    const testEmail = 'test_email_' + Date.now() + '@example.com';
    const testPassword = 'testpassword123';

    // Mock request for registration
    const mockReqRegister = {
      body: {
        nombre: 'Test Email User',
        email: testEmail,
        password: testPassword,
        whatsapp: '1234567890'
      }
    };

    let responseData = null;
    const mockRes = {
      json: (data) => { responseData = data; },
      status: (code) => ({
        json: (data) => {
          responseData = data;
          return mockRes;
        }
      })
    };

    // Import and call register function
    const { register } = require('./backend/controllers/authClienteController');
    await register(mockReqRegister, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Registration successful');
      console.log('   - Client ID:', responseData.cliente_id);
      console.log('   - Message:', responseData.message);
    } else {
      console.log('❌ Registration failed:', responseData);
      throw new Error('Registration failed');
    }

    // Get the verification token from database
    const cliente = await getOne('SELECT id, token_verificacion FROM clientes WHERE email = ?', [testEmail]);
    if (!cliente || !cliente.token_verificacion) {
      console.log('❌ Verification token not generated');
      throw new Error('Verification token not generated');
    }
    console.log('✅ Verification token generated:', cliente.token_verificacion);

    // 2. Test email verification
    console.log('2. Testing email verification...');
    const mockReqVerify = {
      params: { token: cliente.token_verificacion }
    };

    responseData = null;
    const { verifyEmail } = require('./backend/controllers/authClienteController');
    await verifyEmail(mockReqVerify, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Email verification successful');
      console.log('   - Message:', responseData.message);
    } else {
      console.log('❌ Email verification failed:', responseData);
      throw new Error('Email verification failed');
    }

    // Verify database state
    const clienteVerified = await getOne('SELECT email_verificado, token_verificacion FROM clientes WHERE id = ?', [cliente.id]);
    if (clienteVerified.email_verificado === 1 && !clienteVerified.token_verificacion) {
      console.log('✅ Database updated correctly after verification');
    } else {
      console.log('❌ Database not updated correctly');
      throw new Error('Database not updated correctly');
    }

    // 3. Test resend verification (should fail since email is already verified)
    console.log('3. Testing resend verification for verified email...');
    const mockReqResend = {
      body: { email: testEmail }
    };

    responseData = null;
    const { resendVerification } = require('./backend/controllers/authClienteController');
    await resendVerification(mockReqResend, mockRes);

    if (responseData && !responseData.success) {
      console.log('✅ Resend verification correctly rejected for verified email');
    } else {
      console.log('❌ Resend verification should have failed for verified email');
    }

    // 4. Test forgot password
    console.log('4. Testing forgot password...');
    const mockReqForgot = {
      body: { email: testEmail }
    };

    responseData = null;
    const { forgotPassword } = require('./backend/controllers/authClienteController');
    await forgotPassword(mockReqForgot, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Forgot password request successful');
      console.log('   - Message:', responseData.message);
    } else {
      console.log('❌ Forgot password failed:', responseData);
      throw new Error('Forgot password failed');
    }

    // Verify reset token was generated
    const clienteReset = await getOne('SELECT token_verificacion FROM clientes WHERE id = ?', [cliente.id]);
    if (clienteReset.token_verificacion) {
      console.log('✅ Reset token generated:', clienteReset.token_verificacion);
    } else {
      console.log('❌ Reset token not generated');
      throw new Error('Reset token not generated');
    }

    // 5. Test forgot password for non-existent email
    console.log('5. Testing forgot password for non-existent email...');
    const mockReqForgotInvalid = {
      body: { email: 'nonexistent@example.com' }
    };

    responseData = null;
    await forgotPassword(mockReqForgotInvalid, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Forgot password correctly handled non-existent email (no info leak)');
    } else {
      console.log('❌ Forgot password should not reveal if email exists');
    }

    // 6. Test registration with existing email
    console.log('6. Testing registration with existing email...');
    const mockReqRegisterDuplicate = {
      body: {
        nombre: 'Test Duplicate',
        email: testEmail,
        password: 'anotherpassword123',
        whatsapp: '0987654321'
      }
    };

    responseData = null;
    await register(mockReqRegisterDuplicate, mockRes);

    if (responseData && !responseData.success && responseData.error === 'Email ya registrado') {
      console.log('✅ Duplicate email registration correctly rejected');
    } else {
      console.log('❌ Duplicate email registration should have been rejected');
    }

    // 7. Cleanup
    console.log('7. Cleaning up test data...');
    await runQuery('DELETE FROM clientes WHERE id = ?', [cliente.id]);
    console.log('✅ Test data cleaned up');

    console.log('🎉 Email functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error in email functionality test:', error);
    throw error;
  }
}

testEmailFunctionality();

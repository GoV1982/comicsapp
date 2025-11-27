const { runQuery, getOne, getAll } = require('./backend/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testPerfilConfiguracion() {
  try {
    console.log('🧪 Testing profile and configuration functionality...\n');

    // 1. Create test client
    console.log('1. Setting up test client...');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const testEmail = `test_perfil_${Date.now()}@example.com`;

    const clientResult = await runQuery(
      'INSERT INTO clientes (nombre, email, password, whatsapp, email_verificado) VALUES (?, ?, ?, ?, 1)',
      ['Test Perfil', testEmail, hashedPassword, '1234567890']
    );
    const clienteId = clientResult.id;
    console.log(`✅ Test client created with ID: ${clienteId}`);

    // 2. Generate JWT token for authentication
    console.log('\n2. Generating authentication token...');
    const token = jwt.sign(
      { id: clienteId, email: testEmail, tipo: 'cliente' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log('✅ Token generated');

    // 3. Test getPerfil function
    console.log('\n3. Testing getPerfil function...');

    const mockReqPerfil = {
      cliente: { id: clienteId }
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

    const { getPerfil } = require('./backend/controllers/perfilController');
    await getPerfil(mockReqPerfil, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Profile retrieved successfully');
      console.log(`   - Name: ${responseData.data.nombre}`);
      console.log(`   - Email: ${responseData.data.email}`);
      console.log(`   - WhatsApp: ${responseData.data.whatsapp}`);
    } else {
      console.log('❌ Failed to retrieve profile');
    }

    // 4. Test updatePerfil function
    console.log('\n4. Testing updatePerfil function...');

    const mockReqUpdate = {
      cliente: { id: clienteId },
      body: {
        nombre: 'Updated Test Perfil',
        telefono: '0987654321',
        whatsapp: '0987654321',
        direccion: 'Test Address 123',
        notas: 'Test notes'
      }
    };

    await require('./backend/controllers/perfilController').updatePerfil(mockReqUpdate, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Profile updated successfully');
    } else {
      console.log('❌ Failed to update profile');
    }

    // Verify update
    await getPerfil(mockReqPerfil, mockRes);
    if (responseData && responseData.success && responseData.data.nombre === 'Updated Test Perfil') {
      console.log('✅ Profile update verified');
    } else {
      console.log('❌ Profile update not verified');
    }

    // 5. Test changePassword function
    console.log('\n5. Testing changePassword function...');

    const mockReqPassword = {
      cliente: { id: clienteId },
      body: {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword456'
      }
    };

    await require('./backend/controllers/perfilController').changePassword(mockReqPassword, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Password changed successfully');
    } else {
      console.log('❌ Failed to change password');
    }

    // 6. Test getConfiguracion function
    console.log('\n6. Testing getConfiguracion function...');

    const { getConfiguracion } = require('./backend/controllers/configuracionController');
    await getConfiguracion(mockReqPerfil, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Configuration retrieved successfully');
      console.log(`   - Notifications: ${responseData.data.notificaciones}`);
      console.log(`   - Favorite titles: ${Array.isArray(responseData.data.titulos_favoritos) ? responseData.data.titulos_favoritos.length : 0} items`);
    } else {
      console.log('❌ Failed to retrieve configuration');
    }

    // 7. Test updateConfiguracion function
    console.log('\n7. Testing updateConfiguracion function...');

    const mockReqUpdateConfig = {
      cliente: { id: clienteId },
      body: {
        notificaciones: false,
        titulos_favoritos: []
      }
    };

    const { updateConfiguracion } = require('./backend/controllers/configuracionController');
    await updateConfiguracion(mockReqUpdateConfig, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Configuration updated successfully');
    } else {
      console.log('❌ Failed to update configuration');
    }

    // 8. Create test comics for favorites
    console.log('\n8. Creating test comics for favorites...');
    const comic1 = await runQuery(
      'INSERT INTO comics (titulo, numero_edicion, precio, genero, editorial_id) VALUES (?, ?, ?, ?, ?)',
      ['Favorite Comic 1', 1, 15.99, 'Superhéroes', 14]
    );
    const comic2 = await runQuery(
      'INSERT INTO comics (titulo, numero_edicion, precio, genero, editorial_id) VALUES (?, ?, ?, ?, ?)',
      ['Favorite Comic 2', 2, 12.50, 'Aventura', 14]
    );
    console.log('✅ Test comics created');

    // 9. Test addTituloFavorito function
    console.log('\n9. Testing addTituloFavorito function...');

    const mockReqAddFav = {
      cliente: { id: clienteId },
      body: { comic_id: comic1.id }
    };

    const { addTituloFavorito } = require('./backend/controllers/configuracionController');
    await addTituloFavorito(mockReqAddFav, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Favorite added successfully');
    } else {
      console.log('❌ Failed to add favorite');
    }

    // Add second favorite
    mockReqAddFav.body.comic_id = comic2.id;
    await addTituloFavorito(mockReqAddFav, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Second favorite added successfully');
    } else {
      console.log('❌ Failed to add second favorite');
    }

    // 10. Test getTitulosFavoritos function
    console.log('\n10. Testing getTitulosFavoritos function...');

    const { getTitulosFavoritos } = require('./backend/controllers/configuracionController');
    await getTitulosFavoritos(mockReqPerfil, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Favorites retrieved successfully');
      console.log(`   - Number of favorites: ${responseData.data.length}`);
      if (responseData.data.length === 2) {
        console.log('✅ Correct number of favorites returned');
      } else {
        console.log('❌ Incorrect number of favorites returned');
      }
    } else {
      console.log('❌ Failed to retrieve favorites');
    }

    // 11. Test removeTituloFavorito function
    console.log('\n11. Testing removeTituloFavorito function...');

    const mockReqRemoveFav = {
      cliente: { id: clienteId },
      params: { comicId: comic1.id.toString() }
    };

    const { removeTituloFavorito } = require('./backend/controllers/configuracionController');
    await removeTituloFavorito(mockReqRemoveFav, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Favorite removed successfully');
    } else {
      console.log('❌ Failed to remove favorite');
    }

    // Verify removal
    await getTitulosFavoritos(mockReqPerfil, mockRes);
    if (responseData && responseData.success && responseData.data.length === 1) {
      console.log('✅ Favorite removal verified');
    } else {
      console.log('❌ Favorite removal not verified');
    }

    // 12. Test deleteAccount function
    console.log('\n12. Testing deleteAccount function...');

    const { deleteAccount } = require('./backend/controllers/perfilController');
    await deleteAccount(mockReqPerfil, mockRes);

    if (responseData && responseData.success) {
      console.log('✅ Account deleted successfully');
    } else {
      console.log('❌ Failed to delete account');
    }

    // 13. Cleanup
    console.log('\n13. Cleaning up test data...');
    await runQuery('DELETE FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);
    await runQuery('DELETE FROM comics WHERE id IN (?, ?)', [comic1.id, comic2.id]);
    await runQuery('DELETE FROM clientes WHERE id = ?', [clienteId]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Profile and configuration test completed successfully!');

  } catch (error) {
    console.error('❌ Error in profile and configuration test:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPerfilConfiguracion()
    .then(() => {
      console.log('\n✅ All profile and configuration tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Profile and configuration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPerfilConfiguracion };

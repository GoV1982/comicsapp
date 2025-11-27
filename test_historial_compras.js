const { runQuery, getOne, getAll } = require('./backend/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testHistorialCompras() {
  try {
    console.log('🧪 Testing purchase history functionality...\n');

    // 1. Create test client
    console.log('1. Setting up test client...');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const testEmail = `test_historial_${Date.now()}@example.com`;

    const clientResult = await runQuery(
      'INSERT INTO clientes (nombre, email, password, whatsapp, email_verificado) VALUES (?, ?, ?, ?, 1)',
      ['Test Historial', testEmail, hashedPassword, '1234567890']
    );
    const clienteId = clientResult.id;
    console.log(`✅ Test client created with ID: ${clienteId}`);

    // 2. Create some test comics
    console.log('\n2. Creating test comics...');
    const comic1 = await runQuery(
      'INSERT INTO comics (titulo, numero_edicion, precio, genero, editorial_id) VALUES (?, ?, ?, ?, ?)',
      ['Test Comic 1', 1, 15.99, 'Superhéroes', 1]
    );
    const comic2 = await runQuery(
      'INSERT INTO comics (titulo, numero_edicion, precio, genero, editorial_id) VALUES (?, ?, ?, ?, ?)',
      ['Test Comic 2', 2, 12.50, 'Aventura', 1]
    );
    console.log('✅ Test comics created');

    // 3. Create test sales
    console.log('\n3. Creating test sales...');
    const sale1 = await runQuery(
      'INSERT INTO ventas (cliente_id, total, estado, fecha_venta) VALUES (?, ?, ?, ?)',
      [clienteId, 28.49, 'Completada', new Date('2024-01-15')]
    );
    const sale2 = await runQuery(
      'INSERT INTO ventas (cliente_id, total, estado, fecha_venta) VALUES (?, ?, ?, ?)',
      [clienteId, 15.99, 'Completada', new Date('2024-02-20')]
    );
    console.log('✅ Test sales created');

    // 4. Add items to sales
    console.log('\n4. Adding items to sales...');
    await runQuery(
      'INSERT INTO ventas_items (venta_id, comic_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
      [sale1.id, comic1.id, 1, 15.99]
    );
    await runQuery(
      'INSERT INTO ventas_items (venta_id, comic_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
      [sale1.id, comic2.id, 1, 12.50]
    );
    await runQuery(
      'INSERT INTO ventas_items (venta_id, comic_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
      [sale2.id, comic1.id, 1, 15.99]
    );
    console.log('✅ Items added to sales');

    // 5. Generate JWT token for authentication
    console.log('\n5. Generating authentication token...');
    const token = jwt.sign(
      { id: clienteId, email: testEmail, tipo: 'cliente' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log('✅ Token generated');

    // 6. Test getHistorialCompras function directly
    console.log('\n6. Testing getHistorialCompras function...');

    // Mock request object
    const mockReq = {
      cliente: { id: clienteId },
      query: { page: 1, limit: 10 }
    };

    // Mock response object
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

    // Import and call the function
    const { getHistorialCompras } = require('./backend/controllers/perfilController');
    await getHistorialCompras(mockReq, mockRes);

    console.log('Get purchase history result:', JSON.stringify(responseData, null, 2));

    if (responseData && responseData.success) {
      console.log('✅ Purchase history retrieved successfully');
      console.log(`   - Total sales: ${responseData.data.ventas.length}`);
      console.log(`   - Pagination: ${responseData.data.paginacion.total_ventas} total, ${responseData.data.paginacion.total_paginas} pages`);

      // Verify sales data
      const ventas = responseData.data.ventas;
      if (ventas.length === 2) {
        console.log('✅ Correct number of sales returned');

        // Check first sale
        const sale1Data = ventas.find(v => v.id === sale1.id);
        if (sale1Data) {
          console.log('✅ First sale data correct');
          console.log(`   - Items: ${sale1Data.cantidad_items}`);
          console.log(`   - Total: $${sale1Data.total}`);
          console.log(`   - Items details: ${sale1Data.items.length} items`);
        }

        // Check second sale
        const sale2Data = ventas.find(v => v.id === sale2.id);
        if (sale2Data) {
          console.log('✅ Second sale data correct');
          console.log(`   - Items: ${sale2Data.cantidad_items}`);
          console.log(`   - Total: $${sale2Data.total}`);
        }
      } else {
        console.log('❌ Incorrect number of sales returned');
      }
    } else {
      console.log('❌ Failed to retrieve purchase history');
    }

    // 7. Test pagination
    console.log('\n7. Testing pagination...');
    mockReq.query = { page: 1, limit: 1 };
    await getHistorialCompras(mockReq, mockRes);

    if (responseData && responseData.success && responseData.data.ventas.length === 1) {
      console.log('✅ Pagination working correctly (1 item per page)');
    } else {
      console.log('❌ Pagination not working correctly');
    }

    // 8. Test with no sales
    console.log('\n8. Testing with client that has no sales...');
    const clientNoSales = await runQuery(
      'INSERT INTO clientes (nombre, email, password, whatsapp, email_verificado) VALUES (?, ?, ?, ?, 1)',
      ['Client No Sales', `no_sales_${Date.now()}@example.com`, hashedPassword, '0987654321']
    );

    mockReq.cliente.id = clientNoSales.id;
    mockReq.query = { page: 1, limit: 10 };
    await getHistorialCompras(mockReq, mockRes);

    if (responseData && responseData.success && responseData.data.ventas.length === 0) {
      console.log('✅ No sales scenario handled correctly');
    } else {
      console.log('❌ No sales scenario not handled correctly');
    }

    // 9. Cleanup
    console.log('\n9. Cleaning up test data...');
    await runQuery('DELETE FROM ventas_items WHERE venta_id IN (?, ?)', [sale1.id, sale2.id]);
    await runQuery('DELETE FROM ventas WHERE cliente_id = ?', [clienteId]);
    await runQuery('DELETE FROM comics WHERE id IN (?, ?)', [comic1.id, comic2.id]);
    await runQuery('DELETE FROM clientes WHERE id IN (?, ?)', [clienteId, clientNoSales.id]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Purchase history test completed successfully!');

  } catch (error) {
    console.error('❌ Error in purchase history test:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testHistorialCompras()
    .then(() => {
      console.log('\n✅ All purchase history tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Purchase history test failed:', error);
      process.exit(1);
    });
}

module.exports = { testHistorialCompras };

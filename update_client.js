const { runQuery } = require('./backend/config/database');

async function updateClient() {
  try {
    const result = await runQuery(
      'UPDATE clientes SET email_verificado = 1, token_verificacion = NULL, fecha_verificacion = CURRENT_TIMESTAMP WHERE email = ?',
      ['dark_rider_82@yahoo.com.ar']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Email verificado exitosamente para dark_rider_82@yahoo.com.ar');
    } else {
      console.log('❌ No se encontró el cliente o ya estaba verificado');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

updateClient();

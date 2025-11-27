const { runQuery, getOne } = require('../config/database');

async function verifyClient() {
  try {
    console.log('🔍 Verificando cliente de prueba...');

    // Buscar cliente por email
    const cliente = await getOne('SELECT * FROM clientes WHERE email = ?', ['test@example.com']);

    if (!cliente) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('📋 Datos del cliente:');
    console.log(`   ID: ${cliente.id}`);
    console.log(`   Nombre: ${cliente.nombre}`);
    console.log(`   Email: ${cliente.email}`);
    console.log(`   Email verificado: ${cliente.email_verificado ? 'Sí' : 'No'}`);
    console.log(`   Token verificación: ${cliente.token_verificacion || 'Ninguno'}`);

    // Si no está verificado, verificarlo manualmente
    if (!cliente.email_verificado && cliente.token_verificacion) {
      console.log('✅ Verificando email manualmente...');
      await runQuery(
        'UPDATE clientes SET email_verificado = 1, token_verificacion = NULL, fecha_verificacion = CURRENT_TIMESTAMP WHERE id = ?',
        [cliente.id]
      );
      console.log('🎉 Email verificado exitosamente');
    } else if (cliente.email_verificado) {
      console.log('ℹ️  Email ya estaba verificado');
    }

  } catch (error) {
    console.error('❌ Error al verificar cliente:', error);
  }
}

verifyClient().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error en script:', error);
  process.exit(1);
});

const { getOne } = require('./backend/config/database');

async function checkClient() {
  try {
    const cliente = await getOne(
      'SELECT id, nombre, email, email_verificado, token_verificacion, fecha_verificacion FROM clientes WHERE email = ?',
      ['dark_rider_82@yahoo.com.ar']
    );

    if (cliente) {
      console.log('Cliente encontrado:');
      console.log(`ID: ${cliente.id}`);
      console.log(`Nombre: ${cliente.nombre}`);
      console.log(`Email: ${cliente.email}`);
      console.log(`Email verificado: ${cliente.email_verificado ? 'Sí' : 'No'}`);
      console.log(`Token verificación: ${cliente.token_verificacion || 'Ninguno'}`);
      console.log(`Fecha verificación: ${cliente.fecha_verificacion || 'Nunca'}`);
    } else {
      console.log('Cliente no encontrado con ese email.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkClient();

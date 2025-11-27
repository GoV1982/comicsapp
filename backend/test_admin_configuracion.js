const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Función para hacer login como admin
async function loginAdmin() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@comicsstore.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Error al hacer login:', error.response?.data || error.message);
    return null;
  }
}

// Función para probar GET configuración global
async function testGetGlobalConfig(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/configuracion/global`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ GET /configuracion/global exitoso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error en GET /configuracion/global:', error.response?.data || error.message);
    return null;
  }
}

// Función para probar PUT configuración global
async function testUpdateGlobalConfig(token, updates) {
  try {
    const response = await axios.put(`${API_BASE_URL}/configuracion/global`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ PUT /configuracion/global exitoso:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error en PUT /configuracion/global:', error.response?.data || error.message);
    return null;
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de configuración global...\n');

  // 1. Login como admin
  console.log('1. Login como admin...');
  const token = await loginAdmin();
  if (!token) {
    console.error('❌ No se pudo obtener token de admin. Abortando pruebas.');
    return;
  }
  console.log('✅ Login exitoso\n');

  // 2. Obtener configuración global actual
  console.log('2. Obtener configuración global actual...');
  const currentConfig = await testGetGlobalConfig(token);
  if (!currentConfig) {
    console.error('❌ No se pudo obtener configuración global. Abortando pruebas.');
    return;
  }
  console.log('');

  // 3. Actualizar configuración global
  console.log('3. Actualizar configuración global...');
  const updates = {
    tienda_nombre: 'Comics Store Updated',
    email_contacto: 'contacto.updated@comicsstore.com',
    facebook_url: 'https://facebook.com/comicsstore',
    instagram_url: 'https://instagram.com/comicsstore',
    descripcion_tienda: 'Tienda especializada actualizada en cómics y novelas gráficas'
  };
  const updatedConfig = await testUpdateGlobalConfig(token, updates);
  if (!updatedConfig) {
    console.error('❌ No se pudo actualizar configuración global.');
    return;
  }
  console.log('');

  // 4. Verificar que los cambios se aplicaron
  console.log('4. Verificar cambios aplicados...');
  const finalConfig = await testGetGlobalConfig(token);
  if (finalConfig) {
    const changesApplied = Object.keys(updates).every(key =>
      finalConfig[key] === updates[key]
    );
    if (changesApplied) {
      console.log('✅ Todos los cambios se aplicaron correctamente');
    } else {
      console.log('❌ Algunos cambios no se aplicaron correctamente');
      console.log('Cambios esperados:', updates);
      console.log('Configuración final:', finalConfig);
    }
  }

  console.log('\n🎉 Pruebas completadas');
}

// Ejecutar pruebas
runTests().catch(console.error);

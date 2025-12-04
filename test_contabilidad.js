const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

// Reemplaza con tu token de admin
const ADMIN_TOKEN = ''; // Obtén esto logueándote como admin

async function test() {
    console.log('\n🧪 Iniciando pruebas del módulo de contabilidad...\n');

    try {
        // 1. Obtener movimientos
        console.log('1️⃣ Obteniendo todos los movimientos...');
        const movimientos = await axios.get(`${API_URL}/contabilidad`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log(`   ✅ ${movimientos.data.count} movimientos encontrados`);

        // 2. Obtener estadísticas
        console.log('\n2️⃣ Obteniendo estadísticas...');
        const stats = await axios.get(`${API_URL}/contabilidad/estadisticas`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log(`   ✅ Estadísticas obtenidas:`);
        console.log(`      - Total Ingresos: $${stats.data.data.resumen.total_ingresos}`);
        console.log(`      - Total Egresos: $${stats.data.data.resumen.total_egresos}`);
        console.log(`      - Balance: $${stats.data.data.resumen.balance}`);

        // 3. Crear un egreso de prueba
        console.log('\n3️⃣ Creando egreso de prueba...');
        const nuevoEgreso = await axios.post(`${API_URL}/contabilidad`, {
            tipo: 'egreso',
            monto: 150.50,
            categoria: 'Compra de inventario',
            descripcion: 'Prueba de egreso - módulo contable',
            metodo_pago: 'efectivo',
            proveedor: 'Test Provider',
            fecha: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log(`   ✅ Egreso creado con ID: ${nuevoEgreso.data.data.id}`);
        const egresoId = nuevoEgreso.data.data.id;

        // 4. Actualizar el egreso
        console.log('\n4️⃣ Actualizando egreso...');
        await axios.put(`${API_URL}/contabilidad/${egresoId}`, {
            monto: 175.75,
            descripcion: 'Prueba de egreso - ACTUALIZADO'
        }, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('   ✅ Egreso actualizado');

        // 5. Eliminar el egreso
        console.log('\n5️⃣ Eliminando egreso de prueba...');
        await axios.delete(`${API_URL}/contabilidad/${egresoId}`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('   ✅ Egreso eliminado');

        // 6. Crear una venta completada para probar integración
        console.log('\n6️⃣ Probando integración con ventas...');
        console.log('   ℹ️  Necesitas crear una venta completada manualmente desde el panel admin');
        console.log('   ℹ️  Luego verifica que aparece automáticamente en contabilidad');

        console.log('\n✅ ¡Todas las pruebas completadas con éxito!\n');
        console.log('📝 Próximos pasos:');
        console.log('   1. Accede a http://localhost:5173/admin/contabilidad');
        console.log('   2. Crea una venta completada desde /admin/ventas');
        console.log('   3. Verifica que aparece automáticamente como ingreso en contabilidad');
        console.log('   4. Prueba editar el estado de la venta a "cancelada"');
        console.log('   5. Verifica que el ingreso se elimina de contabilidad\n');

    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
        console.log('\n⚠️  Asegúrate de:');
        console.log('   1. Tener el backend corriendo en http://localhost:3002');
        console.log('   2. Haber iniciado sesión como admin y obtenido el token');
        console.log('   3. Reemplazar ADMIN_TOKEN en este script con tu token real\n');
    }
}

// Ejecutar pruebas
test();

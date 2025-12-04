// Script para verificar ventas en la base de datos
const db = require('./config/database').db;

console.log('🔍 Verificando ventas en la base de datos...\n');

try {
    // Obtener todas las ventas
    const ventas = db.prepare('SELECT * FROM ventas ORDER BY id DESC').all();

    console.log(`📊 Total de ventas encontradas: ${ventas.length}\n`);

    if (ventas.length > 0) {
        console.log('Últimas 5 ventas:');
        ventas.slice(0, 5).forEach((venta, index) => {
            console.log(`\n${index + 1}. Venta #${venta.id}`);
            console.log(`   Cliente ID: ${venta.cliente_id || 'Sin cliente'}`);
            console.log(`   Total: $${venta.total}`);
            console.log(`   Estado: ${venta.estado || 'completada'}`);
            console.log(`   Fecha: ${venta.fecha_venta}`);
            console.log(`   Método de pago: ${venta.metodo_pago}`);
            console.log(`   Notas: ${venta.notas || 'Sin notas'}`);
        });

        // Contar por estado
        const porEstado = {};
        ventas.forEach(v => {
            const estado = v.estado || 'completada';
            porEstado[estado] = (porEstado[estado] || 0) + 1;
        });

        console.log('\n📈 Ventas por estado:');
        Object.entries(porEstado).forEach(([estado, count]) => {
            console.log(`   ${estado}: ${count}`);
        });
    } else {
        console.log('❌ No se encontraron ventas en la base de datos');
    }

} catch (error) {
    console.error('❌ Error al consultar ventas:', error);
}

const db = require('better-sqlite3')('../database.db');

console.log('🌱 Sembrando datos para Análisis Avanzado...');

try {
    // 1. Limpiar datos de prueba anteriores (opcional, para no duplicar demasiado)
    // db.prepare("DELETE FROM movimientos_contables WHERE descripcion LIKE '%TEST_ANALISIS%'").run();

    const hoy = new Date();
    const mesActualStr = hoy.toISOString().slice(0, 7); // YYYY-MM

    // Calcular mes anterior
    const mesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mesAnteriorStr = mesAnteriorDate.toISOString().slice(0, 7);

    console.log(`📅 Mes Actual: ${mesActualStr}`);
    console.log(`📅 Mes Anterior: ${mesAnteriorStr}`);

    // 2. Insertar Ingresos Mes Anterior (Noviembre)
    // Insertamos 3 movimientos que sumen $10,000
    const stmt = db.prepare(`
        INSERT INTO movimientos_contables (tipo, monto, fecha, categoria, descripcion, metodo_pago)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run('ingreso', 5000, `${mesAnteriorStr}-05 10:00:00`, 'Ventas de comics', 'Venta TEST_ANALISIS Mes Anterior 1', 'efectivo');
    stmt.run('ingreso', 3000, `${mesAnteriorStr}-15 15:30:00`, 'Ventas de comics', 'Venta TEST_ANALISIS Mes Anterior 2', 'tarjeta');
    stmt.run('ingreso', 2000, `${mesAnteriorStr}-25 09:15:00`, 'Otros ingresos', 'Servicio TEST_ANALISIS Mes Anterior', 'transferencia');

    console.log(`✅ Insertados $10,000 en ingresos para ${mesAnteriorStr}`);

    // 3. Insertar Ingresos Mes Actual (Diciembre)
    // Insertamos movimientos que sumen $12,000 (Crecimiento del 20%)
    // Nota: Usamos fechas pasadas del mes actual para que cuenten como "transcurridas"
    stmt.run('ingreso', 4000, `${mesActualStr}-01 11:00:00`, 'Ventas de comics', 'Venta TEST_ANALISIS Mes Actual 1', 'efectivo');
    stmt.run('ingreso', 4000, `${mesActualStr}-02 14:00:00`, 'Ventas de comics', 'Venta TEST_ANALISIS Mes Actual 2', 'tarjeta');
    stmt.run('ingreso', 4000, `${mesActualStr}-03 16:45:00`, 'Otros ingresos', 'Venta TEST_ANALISIS Mes Actual 3', 'efectivo');

    console.log(`✅ Insertados $12,000 en ingresos para ${mesActualStr}`);

    console.log('\n📊 Resultados esperados en el Frontend:');
    console.log('----------------------------------------');
    console.log('1. Sección "Análisis Avanzado" DEBE aparecer (ahora hay 2 meses).');
    console.log('2. Comparativa Mensual:');
    console.log('   - Mes Anterior: $10,000');
    console.log('   - Mes Actual: $12,000');
    console.log('   - Crecimiento: +20.0% ((12000-10000)/10000 * 100)');
    console.log('3. Proyección de Cierre:');

    const diasTranscurridos = hoy.getDate();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const proyeccion = (12000 / diasTranscurridos) * diasEnMes;

    console.log(`   - Días transcurridos: ${diasTranscurridos}`);
    console.log(`   - Promedio diario: $${(12000 / diasTranscurridos).toFixed(2)}`);
    console.log(`   - Proyección: $${proyeccion.toFixed(2)}`);

} catch (error) {
    console.error('❌ Error al sembrar datos:', error);
}

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('🔄 Agregando soporte de multimoneda a movimientos_contables...\n');

try {
    // Verificar si las columnas ya existen
    const tableInfo = db.prepare("PRAGMA table_info(movimientos_contables)").all();
    const hasMoneda = tableInfo.some(col => col.name === 'moneda');
    const hasTasaCambio = tableInfo.some(col => col.name === 'tasa_cambio');

    if (hasMoneda && hasTasaCambio) {
        console.log('✅ Las columnas de multimoneda ya existen.');
        process.exit(0);
    }

    // Agregar columnas
    if (!hasMoneda) {
        db.prepare(`
            ALTER TABLE movimientos_contables 
            ADD COLUMN moneda TEXT DEFAULT 'ARS'
        `).run();
        console.log('✅ Columna "moneda" agregada');
    }

    if (!hasTasaCambio) {
        db.prepare(`
            ALTER TABLE movimientos_contables 
            ADD COLUMN tasa_cambio DECIMAL(10,4) DEFAULT 1.0
        `).run();
        console.log('✅ Columna "tasa_cambio" agregada');
    }

    // Crear índice
    try {
        db.prepare('CREATE INDEX IF NOT EXISTS idx_movimientos_moneda ON movimientos_contables(moneda)').run();
        console.log('✅ Índice en moneda creado');
    } catch (err) {
        console.log('⚠️  Índice ya existe o error al crear:', err.message);
    }

    console.log('\n✅ Migración de multimoneda completada exitosamente!\n');
    console.log('📝 Monedas soportadas:');
    console.log('   - ARS (Peso Argentino) - Moneda base');
    console.log('   - USD (Dólar)');
    console.log('   - EUR (Euro)');
    console.log('   - BRL (Real Brasileño)\n');

} catch (error) {
    console.error('❌ Error al agregar soporte de multimoneda:', error);
    process.exit(1);
}

db.close();

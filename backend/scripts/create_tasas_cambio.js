const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('🔄 Creando sistema de tasas de cambio configurables...\n');

try {
    // Crear tabla de tasas de cambio
    db.prepare(`
        CREATE TABLE IF NOT EXISTS tasas_cambio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            moneda TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            simbolo TEXT NOT NULL,
            tasa DECIMAL(10,4) NOT NULL,
            activo INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    console.log('✅ Tabla tasas_cambio creada');

    // Insertar tasas iniciales (solo si no existen)
    const monedasIniciales = [
        { moneda: 'ARS', nombre: 'Peso Argentino', simbolo: '$', tasa: 1.0 },
        { moneda: 'USD', nombre: 'Dólar Estadounidense', simbolo: 'US$', tasa: 1000.0 },
        { moneda: 'EUR', nombre: 'Euro', simbolo: '€', tasa: 1100.0 },
        { moneda: 'BRL', nombre: 'Real Brasileño', simbolo: 'R$', tasa: 180.0 }
    ];

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO tasas_cambio (moneda, nombre, simbolo, tasa)
        VALUES (?, ?, ?, ?)
    `);

    for (const m of monedasIniciales) {
        stmt.run(m.moneda, m.nombre, m.simbolo, m.tasa);
    }

    console.log('✅ Tasas iniciales insertadas');

    // Crear índice
    db.prepare('CREATE INDEX IF NOT EXISTS idx_tasa_moneda ON tasas_cambio(moneda)').run();
    console.log('✅ Índice creado');

    console.log('\n📊 Tasas de cambio configuradas:');
    const tasas = db.prepare('SELECT * FROM tasas_cambio').all();
    tasas.forEach(t => {
        console.log(`   ${t.moneda}: ${t.simbolo} (1 ARS = ${(1 / t.tasa).toFixed(4)} ${t.moneda})`);
    });

    console.log('\n✅ Sistema de tasas de cambio listo!');
    console.log('\nAhora puedes:');
    console.log('1. Configurar tasas desde /admin/contabilidad');
    console.log('2. Los clientes verán precios en su moneda preferida\n');

} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}

db.close();

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('🔄 Creando tabla de movimientos_contables...');

try {
    // Crear tabla de movimientos contables
    db.exec(`
    CREATE TABLE IF NOT EXISTS movimientos_contables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'egreso')),
      monto DECIMAL(10,2) NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      metodo_pago TEXT,
      proveedor TEXT,
      comprobante TEXT,
      venta_id INTEGER,
      editorial_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
      FOREIGN KEY (editorial_id) REFERENCES editoriales(id) ON DELETE SET NULL
    )
  `);

    console.log('✅ Tabla movimientos_contables creada exitosamente');

    // Crear índices para mejorar el rendimiento
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_contables(tipo);
    CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_contables(fecha);
    CREATE INDEX IF NOT EXISTS idx_movimientos_venta ON movimientos_contables(venta_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON movimientos_contables(categoria);
  `);

    console.log('✅ Índices creados exitosamente');

    // Verificar la estructura
    const columns = db.prepare("PRAGMA table_info(movimientos_contables)").all();
    console.log('\n📋 Estructura de la tabla:');
    columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}`);
    });

    // Contar registros existentes
    const count = db.prepare("SELECT COUNT(*) as count FROM movimientos_contables").get();
    console.log(`\n📊 Total de registros: ${count.count}`);

} catch (error) {
    console.error('❌ Error al crear la tabla:', error.message);
    process.exit(1);
} finally {
    db.close();
}

console.log('\n✨ Migración completada con éxito');

// backend/scripts/migrateClientes.js
const { runQuery, getOne, getAll } = require('../config/database');
const bcrypt = require('bcrypt');

async function migrateClientes() {
  try {
    console.log('🚀 Iniciando migración de clientes...');

    // Verificar si ya existe la columna password en clientes
    const checkPasswordColumn = await getOne(`
      SELECT name FROM pragma_table_info('clientes') WHERE name='password'
    `);

    if (!checkPasswordColumn) {
      console.log('📝 Agregando campos de autenticación a tabla clientes...');

      // Agregar campos de autenticación
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN password TEXT
      `);
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN whatsapp TEXT
      `);
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN email_verificado BOOLEAN DEFAULT 0
      `);
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN token_verificacion TEXT
      `);
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN fecha_verificacion DATETIME
      `);
      await runQuery(`
        ALTER TABLE clientes ADD COLUMN ultimo_acceso DATETIME
      `);

      console.log('✅ Campos de autenticación agregados');
    } else {
      console.log('ℹ️  Campos de autenticación ya existen');
    }

    // Crear tabla carritos
    console.log('📝 Creando tabla carritos...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS carritos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        session_id TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        UNIQUE(cliente_id),
        UNIQUE(session_id)
      )
    `);

    // Crear tabla carritos_items
    console.log('📝 Creando tabla carritos_items...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS carritos_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carrito_id INTEGER NOT NULL,
        comic_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1,
        precio_unitario REAL NOT NULL,
        fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
        FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
        UNIQUE(carrito_id, comic_id)
      )
    `);

    // Crear tabla configuracion_clientes
    console.log('📝 Creando tabla configuracion_clientes...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS configuracion_clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL UNIQUE,
        notificaciones BOOLEAN DEFAULT 1,
        titulos_favoritos TEXT, -- JSON array de comic_ids
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);

    // Crear índices para mejor rendimiento
    console.log('📝 Creando índices...');
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_carritos_cliente_id ON carritos(cliente_id)
    `);
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_carritos_session_id ON carritos(session_id)
    `);
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_carritos_items_carrito_id ON carritos_items(carrito_id)
    `);
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_carritos_items_comic_id ON carritos_items(comic_id)
    `);
    await runQuery(`
      CREATE INDEX IF NOT EXISTS idx_configuracion_clientes_cliente_id ON configuracion_clientes(cliente_id)
    `);

    // Crear triggers para actualizar fecha_actualizacion
    console.log('📝 Creando triggers...');
    await runQuery(`
      CREATE TRIGGER IF NOT EXISTS update_carritos_timestamp
      AFTER UPDATE ON carritos
      BEGIN
        UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    await runQuery(`
      CREATE TRIGGER IF NOT EXISTS update_configuracion_timestamp
      AFTER UPDATE ON configuracion_clientes
      BEGIN
        UPDATE configuracion_clientes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    console.log('✅ Migración completada exitosamente');

    // Mostrar resumen
    const clientesCount = await getOne('SELECT COUNT(*) as count FROM clientes');
    const carritosCount = await getOne('SELECT COUNT(*) as count FROM carritos');
    const itemsCount = await getOne('SELECT COUNT(*) as count FROM carritos_items');
    const configCount = await getOne('SELECT COUNT(*) as count FROM configuracion_clientes');

    console.log('\n📊 Resumen de migración:');
    console.log(`   Clientes: ${clientesCount.count}`);
    console.log(`   Carritos: ${carritosCount.count}`);
    console.log(`   Items en carritos: ${itemsCount.count}`);
    console.log(`   Configuraciones: ${configCount.count}`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateClientes()
    .then(() => {
      console.log('\n🎉 Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateClientes };

const { runQuery, db } = require('../config/database');

async function updateDatabase() {
    try {
        console.log('🔄 Actualizando base de datos para sistema de clientes...');

        // 1. Modificar tabla clientes - agregar campos de autenticación
        console.log('📝 Modificando tabla clientes...');

        // Verificar y agregar columnas necesarias
        const columnsToAdd = [
            { name: 'password', type: 'TEXT' },
            { name: 'whatsapp', type: 'TEXT' },
            { name: 'email_verificado', type: 'INTEGER DEFAULT 0' },
            { name: 'token_verificacion', type: 'TEXT' },
            { name: 'fecha_verificacion', type: 'DATETIME' },
            { name: 'fecha_token_verificacion', type: 'DATETIME' },
            { name: 'ultimo_acceso', type: 'DATETIME' }
        ];

        for (const col of columnsToAdd) {
            const checkColumn = await runQuery(`
                SELECT name FROM pragma_table_info('clientes')
                WHERE name = '${col.name}'
            `);

            if (checkColumn.length === 0) {
                await runQuery(`
                    ALTER TABLE clientes
                    ADD COLUMN ${col.name} ${col.type}
                `);
                console.log(`✅ Columna ${col.name} agregada`);
            } else {
                console.log(`ℹ️ Columna ${col.name} ya existe`);
            }
        }

        // 2. Crear tabla carritos
        console.log('🛒 Creando tabla carritos...');
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
        console.log('✅ Tabla carritos creada');

        // 3. Crear tabla carritos_items
        console.log('📦 Creando tabla carritos_items...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS carritos_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carrito_id INTEGER NOT NULL,
                comic_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 1,
                precio_unitario REAL NOT NULL,
                fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
                FOREIGN KEY (comic_id) REFERENCES comics(id),
                UNIQUE(carrito_id, comic_id)
            )
        `);
        console.log('✅ Tabla carritos_items creada');

        // 4. Crear tabla configuracion_clientes
        console.log('⚙️ Creando tabla configuracion_clientes...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS configuracion_clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL UNIQUE,
                notificaciones INTEGER DEFAULT 1,
                titulos_favoritos TEXT, -- JSON array de comic_ids
                generos_favoritos TEXT, -- JSON array de géneros
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla configuracion_clientes creada');

        // 5. Crear tabla historial_compras (para historial de compras del cliente)
        console.log('📚 Creando tabla historial_compras...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS historial_compras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL,
                venta_id INTEGER NOT NULL,
                comic_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                fecha_compra DATETIME NOT NULL,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                FOREIGN KEY (comic_id) REFERENCES comics(id)
            )
        `);
        console.log('✅ Tabla historial_compras creada');

        // 6. Crear índices para mejor performance
        console.log('🔍 Creando índices...');
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_carritos_cliente ON carritos(cliente_id)',
            'CREATE INDEX IF NOT EXISTS idx_carritos_session ON carritos(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_carritos_items_carrito ON carritos_items(carrito_id)',
            'CREATE INDEX IF NOT EXISTS idx_carritos_items_comic ON carritos_items(comic_id)',
            'CREATE INDEX IF NOT EXISTS idx_configuracion_cliente ON configuracion_clientes(cliente_id)',
            'CREATE INDEX IF NOT EXISTS idx_historial_cliente ON historial_compras(cliente_id)',
            'CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_compras(fecha_compra)'
        ];

        for (const index of indices) {
            await runQuery(index);
        }
        console.log('✅ Índices creados');

        // 7. Crear triggers para actualizar timestamps
        console.log('⚡ Creando triggers...');
        const triggers = [
            `CREATE TRIGGER IF NOT EXISTS update_carrito_timestamp
             AFTER UPDATE ON carritos
             BEGIN
               UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
             END;`,

            `CREATE TRIGGER IF NOT EXISTS update_configuracion_timestamp
             AFTER UPDATE ON configuracion_clientes
             BEGIN
               UPDATE configuracion_clientes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
             END;`
        ];

        for (const trigger of triggers) {
            await runQuery(trigger);
        }
        console.log('✅ Triggers creados');

        console.log('🎉 Base de datos actualizada exitosamente para sistema de clientes!');

    } catch (error) {
        console.error('❌ Error al actualizar base de datos:', error);
        console.error(error);
    } finally {
        // Cerrar la base de datos para asegurar que se persistan los cambios
        db.close((err) => {
            if (err) {
                console.error('❌ Error al cerrar la base de datos:', err.message);
            } else {
                console.log('✅ Base de datos cerrada correctamente');
            }
        });
    }
}

// Ejecutar y esperar a que termine
updateDatabase().then(() => {
    console.log('✅ Script completado');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
});

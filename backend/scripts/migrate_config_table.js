const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log("Starting migration...");

// 1. Rename table if needed
try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracion_clientes'").get();
    const targetExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracion_cliente'").get();

    if (tableExists && !targetExists) {
        console.log("Renaming configuracion_clientes to configuracion_cliente...");
        db.prepare("ALTER TABLE configuracion_clientes RENAME TO configuracion_cliente").run();
    } else if (!tableExists && !targetExists) {
        console.log("Creating configuracion_cliente table...");
        db.prepare(`
            CREATE TABLE configuracion_cliente (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL UNIQUE,
                notificaciones_email BOOLEAN DEFAULT 1,
                notificaciones_push BOOLEAN DEFAULT 1,
                notificaciones_whatsapp BOOLEAN DEFAULT 0,
                notificaciones_similares BOOLEAN DEFAULT 1,
                mostrar_favoritos BOOLEAN DEFAULT 1,
                privacidad_perfil TEXT DEFAULT 'publico',
                tema TEXT DEFAULT 'light',
                idioma TEXT DEFAULT 'es',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
    } else {
        console.log("Table configuracion_cliente already exists.");
    }
} catch (e) {
    console.log("Error handling table rename/create:", e.message);
}

// 2. Add missing columns
const columnsToAdd = [
    { name: 'notificaciones_email', type: 'BOOLEAN DEFAULT 1' },
    { name: 'notificaciones_push', type: 'BOOLEAN DEFAULT 1' },
    { name: 'notificaciones_whatsapp', type: 'BOOLEAN DEFAULT 0' },
    { name: 'notificaciones_similares', type: 'BOOLEAN DEFAULT 1' },
    { name: 'mostrar_favoritos', type: 'BOOLEAN DEFAULT 1' },
    { name: 'privacidad_perfil', type: 'TEXT DEFAULT "publico"' },
    { name: 'tema', type: 'TEXT DEFAULT "light"' },
    { name: 'idioma', type: 'TEXT DEFAULT "es"' }
];

try {
    const existingCols = db.prepare("PRAGMA table_info(configuracion_cliente)").all().map(c => c.name);

    for (const col of columnsToAdd) {
        if (!existingCols.includes(col.name)) {
            console.log(`Adding column ${col.name}...`);
            try {
                db.prepare(`ALTER TABLE configuracion_cliente ADD COLUMN ${col.name} ${col.type}`).run();
            } catch (e) {
                console.log(`Error adding column ${col.name}:`, e.message);
            }
        }
    }
} catch (e) {
    console.log("Error checking columns:", e.message);
}

console.log("Migration complete.");

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log("Migrating data...");

try {
    // Check if 'notificaciones' column exists (from old schema)
    const cols = db.prepare("PRAGMA table_info(configuracion_cliente)").all();
    const hasOldCol = cols.some(c => c.name === 'notificaciones');
    const hasNewCol = cols.some(c => c.name === 'notificaciones_email');

    if (hasOldCol && hasNewCol) {
        console.log("Copying notificaciones to notificaciones_email...");
        db.prepare("UPDATE configuracion_cliente SET notificaciones_email = notificaciones WHERE notificaciones IS NOT NULL").run();
        console.log("Data migrated.");
    } else {
        console.log("Columns not found, skipping data migration.");
    }
} catch (e) {
    console.log("Error migrating data:", e.message);
}

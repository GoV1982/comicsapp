const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log("\nColumns in 'configuracion_clientes':");
try {
    const cols = db.prepare("PRAGMA table_info(configuracion_clientes)").all();
    console.log(cols.map(c => c.name));
} catch (e) { console.log("Error reading configuracion_clientes:", e.message); }

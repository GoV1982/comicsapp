const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log("Creating reviews table...");

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            comic_id INTEGER NOT NULL,
            puntuacion INTEGER NOT NULL CHECK(puntuacion >= 1 AND puntuacion <= 5),
            comentario TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
            FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
            UNIQUE(cliente_id, comic_id)
        );

        CREATE INDEX IF NOT EXISTS idx_reviews_comic ON reviews(comic_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_cliente ON reviews(cliente_id);
    `);
    console.log("Reviews table created successfully.");
} catch (e) {
    console.log("Error creating reviews table:", e.message);
}

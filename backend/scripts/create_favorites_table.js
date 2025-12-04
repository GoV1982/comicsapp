const { db } = require('../config/database');

console.log('Iniciando creación de tabla titulos_favoritos...');

try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS titulos_favoritos (
      cliente_id INTEGER NOT NULL,
      comic_id INTEGER NOT NULL,
      fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cliente_id, comic_id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
    );
  `);
    console.log('✅ Tabla titulos_favoritos creada correctamente');
} catch (error) {
    console.error('❌ Error al crear tabla titulos_favoritos:', error);
}

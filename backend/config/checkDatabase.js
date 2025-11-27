const { getOne, runQuery } = require('./database');

const checkUsersTable = async () => {
  try {
    // Verificar si existe la tabla en SQLite
    const checkTableQuery = `
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name='usuarios'
    `;

    const result = await getOne(checkTableQuery);

    if (!result) {
      // Crear tabla si no existe
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          nombre TEXT NOT NULL,
          fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
          ultimo_acceso DATETIME,
          rol TEXT CHECK(rol IN ('admin', 'usuario')) DEFAULT 'usuario'
        )
      `;

      await runQuery(createTableQuery);
      console.log('✅ Tabla usuarios creada exitosamente');
    } else {
      console.log('✅ Tabla usuarios ya existe');
    }
  } catch (error) {
    console.error('❌ Error al verificar/crear tabla usuarios:', error);
    throw error;
  }
};

module.exports = { checkUsersTable };

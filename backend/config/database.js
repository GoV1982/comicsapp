// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'database.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Schema completo de la base de datos
const schema = `
-- Tabla de usuarios (administradores)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME
);

-- Tabla de editoriales
CREATE TABLE IF NOT EXISTS editoriales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comics/mangas
CREATE TABLE IF NOT EXISTS comics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  numero_edicion TEXT NOT NULL,
  editorial_id INTEGER NOT NULL,
  precio REAL NOT NULL,
  genero TEXT NOT NULL,
  subgenero TEXT,
  imagen_url TEXT,
  descripcion TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (editorial_id) REFERENCES editoriales(id)
);

-- Tabla de stock/inventario
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comic_id INTEGER NOT NULL UNIQUE,
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  notas TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  notas TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de detalle de ventas
CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL,
  comic_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (comic_id) REFERENCES comics(id)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  comic_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME NOT NULL,
  metodo_pago TEXT,
  monto_adelanto REAL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (comic_id) REFERENCES comics(id)
);

-- Tabla de compras a proveedores
CREATE TABLE IF NOT EXISTS compras_proveedor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor_id INTEGER NOT NULL,
  fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL,
  notas TEXT,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- Tabla de detalle de compras
CREATE TABLE IF NOT EXISTS compras_proveedor_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id INTEGER NOT NULL,
  comic_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (compra_id) REFERENCES compras_proveedor(id) ON DELETE CASCADE,
  FOREIGN KEY (comic_id) REFERENCES comics(id)
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL UNIQUE,
  valor TEXT,
  descripcion TEXT
);

-- Tabla de backups
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo TEXT NOT NULL,
  ruta_gdrive TEXT,
  fecha_backup DATETIME DEFAULT CURRENT_TIMESTAMP,
  tipo TEXT NOT NULL,
  estado TEXT NOT NULL,
  mensaje TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comics_editorial ON comics(editorial_id);
CREATE INDEX IF NOT EXISTS idx_comics_genero ON comics(genero);
CREATE INDEX IF NOT EXISTS idx_stock_comic ON stock(comic_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_exp ON reservas(fecha_expiracion);
`;

// Triggers
const triggers = `
-- Trigger: Actualizar timestamp en comics
CREATE TRIGGER IF NOT EXISTS update_comic_timestamp 
AFTER UPDATE ON comics
BEGIN
  UPDATE comics SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Actualizar timestamp en stock
CREATE TRIGGER IF NOT EXISTS update_stock_timestamp 
AFTER UPDATE ON stock
BEGIN
  UPDATE stock SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Crear stock para nuevo comic
CREATE TRIGGER IF NOT EXISTS create_stock_for_new_comic
AFTER INSERT ON comics
BEGIN
  INSERT INTO stock (comic_id, cantidad_disponible) VALUES (NEW.id, 0);
END;

-- Trigger: Actualizar stock después de venta
CREATE TRIGGER IF NOT EXISTS update_stock_after_sale
AFTER INSERT ON ventas_detalle
BEGIN
  UPDATE stock 
  SET cantidad_disponible = cantidad_disponible - NEW.cantidad 
  WHERE comic_id = NEW.comic_id;
END;

-- Trigger: Calcular fecha expiración reservas (15 días)
CREATE TRIGGER IF NOT EXISTS set_reserva_expiracion
BEFORE INSERT ON reservas
WHEN NEW.fecha_expiracion IS NULL
BEGIN
  SELECT datetime(NEW.fecha_reserva, '+15 days');
END;
`;

// Función para inicializar la base de datos
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Ejecutar schema
        await new Promise((res, rej) => {
          db.exec(schema, (err) => {
            if (err) rej(err);
            else {
              console.log('✅ Tablas creadas correctamente');
              res();
            }
          });
        });

        // Ejecutar triggers
        await new Promise((res, rej) => {
          db.exec(triggers, (err) => {
            if (err) rej(err);
            else {
              console.log('✅ Triggers creados correctamente');
              res();
            }
          });
        });

        // Crear usuario admin inicial si no existe
        const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.ADMIN_NAME || 'Administrador';
        const adminEmail = process.env.ADMIN_EMAIL || '';

        db.get('SELECT id FROM usuarios WHERE username = ?', [adminUsername], async (err, row) => {
          if (!row) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            db.run(
              'INSERT INTO usuarios (username, password, nombre, email) VALUES (?, ?, ?, ?)',
              [adminUsername, hashedPassword, adminName, adminEmail],
              (err) => {
                if (err) {
                  console.error('❌ Error al crear usuario admin:', err.message);
                } else {
                  console.log('✅ Usuario admin creado correctamente');
                  console.log(`   Usuario: ${adminUsername}`);
                  console.log(`   Contraseña: ${adminPassword}`);
                  console.log('   ⚠️  Cambia la contraseña después del primer login');
                }
              }
            );
          } else {
            console.log('ℹ️  Usuario admin ya existe');
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Función helper para ejecutar queries
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Función helper para obtener un registro
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Función helper para obtener múltiples registros
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  initDatabase,
  runQuery,
  getOne,
  getAll
};
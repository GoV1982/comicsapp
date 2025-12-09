# 💾 Guía de Migración de Base de Datos

Tu aplicación usa **SQLite** en desarrollo, pero para producción tienes dos opciones:

## Opción A: Turso (Mantener SQLite) ⭐ MÁS FÁCIL
## Opción B: PostgreSQL (Más Robusto)

---

## 🎯 OPCIÓN A: Turso - SQLite en la Nube

**Ventajas:**
- ✅ No necesitas cambiar código
- ✅ Setup en 10 minutos
- ✅ Compatible 100% con tu app actual
- ✅ 9 GB gratis

**Pasos:**

### 1. Instalar Turso CLI

```bash
# En PowerShell
npm install -g @tursodatabase/cli
```

### 2. Crear Cuenta y Base de Datos

```bash
# Crear cuenta
turso auth signup

# Crear base de datos
turso db create comiqueria

# Ver información
turso db show comiqueria
```

### 3. Subir tu Base de Datos Actual

```bash
# Ir a la carpeta backend
cd backend

# Subir database.db a Turso
turso db shell comiqueria < database.db
```

### 4. Obtener Credentials

```bash
# URL de la base de datos
turso db show comiqueria --url

# Token de autenticación
turso db tokens create comiqueria
```

Te dará algo como:
```
URL: libsql://comiqueria-tu-usuario.turso.io
Token: eyJhbGc...largo_token_aqui
```

### 5. Actualizar Código Backend

Instalar dependencia:
```bash
cd backend
npm install @libsql/client
```

Crear `backend/config/database-turso.js`:
```javascript
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./database.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

const getAll = async (query, params = []) => {
  const result = await client.execute({
    sql: query,
    args: params
  });
  return result.rows;
};

const getOne = async (query, params = []) => {
  const result = await client.execute({
    sql: query,
    args: params
  });
  return result.rows[0] || null;
};

const runQuery = async (query, params = []) => {
  const result = await client.execute({
    sql: query,
    args: params
  });
  return {
    insertId: result.lastInsertRowid,
    changes: result.rowsAffected
  };
};

module.exports = { getAll, getOne, runQuery, client };
```

Actualizar `backend/config/database.js`:
```javascript
// Usar Turso en producción, SQLite local en desarrollo
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  module.exports = require('./database-turso');
} else {
  module.exports = require('./database-sqlite'); // Tu archivo actual renombrado
}
```

### 6. Variables de Entorno en Render

En Render, agregar:
```
DATABASE_URL=libsql://comiqueria-tu-usuario.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...tu_token_aqui
```

### 7. ¡Deploy!

```bash
git add .
git commit -m "Configurar Turso para producción"
git push
```

Render re-deployará automáticamente.

---

## 🐘 OPCIÓN B: PostgreSQL

**Ventajas:**
- ✅ Más robusto para producción
- ✅ Mejor para múltiples usuarios concurrentes
- ✅ Gratis en Render

**Desventajas:**
- ❌ Requiere más cambios de código
- ❌ Necesitas migrar esquema y datos

### Paso 1: Instalar PostgreSQL Driver

```bash
cd backend
npm install pg
```

### Paso 2: Crear Adapter PostgreSQL

Crear `backend/config/database-postgres.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

const getAll = async (query, params = []) => {
  try {
    // Convertir placeholders de SQLite (?) a PostgreSQL ($1, $2, etc.)
    let pgQuery = query;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    const result = await pool.query(pgQuery, params);
    return result.rows;
  } catch (error) {
    console.error('Error en getAll:', error);
    throw error;
  }
};

const getOne = async (query, params = []) => {
  const rows = await getAll(query, params);
  return rows[0] || null;
};

const runQuery = async (query, params = []) => {
  try {
    let pgQuery = query;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    // Para INSERT, necesitamos RETURNING id
    if (pgQuery.trim().toUpperCase().startsWith('INSERT')) {
      if (!pgQuery.toUpperCase().includes('RETURNING')) {
        // Agregar RETURNING id si no existe
        pgQuery = pgQuery.trim();
        if (pgQuery.endsWith(';')) {
          pgQuery = pgQuery.slice(0, -1);
        }
        pgQuery += ' RETURNING id';
      }
    }

    const result = await pool.query(pgQuery, params);
    
    return {
      insertId: result.rows[0]?.id || null,
      changes: result.rowCount || 0
    };
  } catch (error) {
    console.error('Error en runQuery:', error);
    throw error;
  }
};

module.exports = { getAll, getOne, runQuery, pool };
```

### Paso 3: Actualizar database.js Principal

```javascript
// backend/config/database.js
const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');

if (usePostgres) {
  console.log('📊 Using PostgreSQL');
  module.exports = require('./database-postgres');
} else {
  console.log('📊 Using SQLite');
  
  // Tu código SQLite actual aquí...
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  // ... resto de tu código actual
}
```

### Paso 4: Exportar Esquema de SQLite

Crear script `backend/scripts/export-schema.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.db');

db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error(err);
    return;
  }

  let schema = '';
  tables.forEach(table => {
    if (table.sql) {
      // Convertir de SQLite a PostgreSQL
      let sql = table.sql;
      
      // Cambios básicos
      sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
      sql = sql.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      sql = sql.replace(/TEXT/g, 'VARCHAR(255)');
      
      schema += sql + ';\n\n';
    }
  });

  fs.writeFileSync('schema-postgres.sql', schema);
  console.log('✅ Schema exportado a schema-postgres.sql');
  console.log('⚠️  Revisa y ajusta manualmente antes de usar');
});

db.close();
```

Ejecutar:
```bash
node scripts/export-schema.js
```

### Paso 5: Crear Base de Datos PostgreSQL en Render

1. En Render dashboard → "New +" → "PostgreSQL"
2. Name: `comiqueria-db`
3. Copiar "Internal Database URL"

### Paso 6: Ejecutar Schema en PostgreSQL

Opción 1 - Desde local (necesitas psql):
```bash
psql <DATABASE_URL> < schema-postgres.sql
```

Opción 2 - Desde Render Shell:
1. Ir a tu servicio PostgreSQL en Render
2. Click "Connect"
3. Copiar y pegar el contenido de schema-postgres.sql

### Paso 7: Migrar Datos

Crear `backend/scripts/migrate-data.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqliteDb = new sqlite3.Database('./database.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL_POSTGRES
});

async function migrateTa(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Migrando ${rows.length} registros de ${tableName}...`);

      for (const row of rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        
        try {
          await pgPool.query(query, values);
        } catch (error) {
          console.error(`Error insertando en ${tableName}:`, error.message);
        }
      }

      console.log(`✅ ${tableName} migrado`);
      resolve();
    });
  });
}

async function migrate() {
  const tables = [
    'usuarios',
    'editoriales',
    'comics',
    'stock',
    'clientes',
    // ... agregar todas tus tablas en orden de dependencias
  ];

  for (const table of tables) {
    await migrateTable(table);
  }

  console.log('✅ Migración completada');
  process.exit(0);
}

migrate();
```

Ejecutar:
```bash
DATABASE_URL_POSTGRES="tu_url_postgres" node scripts/migrate-data.js
```

### Paso 8: Variables en Render

```
NODE_ENV=production
DATABASE_URL=<Internal PostgreSQL URL de Render>
JWT_SECRET=tu_secreto_aqui
```

### Paso 9: Deploy

```bash
git add .
git commit -m "Migrar a PostgreSQL"
git push
```

---

## 🤔 ¿Cuál Elegir?

| Criterio | Turso | PostgreSQL |
|----------|-------|------------|
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Tiempo Setup** | 10 min | 1-2 horas |
| **Cambios de Código** | Mínimos | Moderados |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Concurrencia** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Mi Recomendación:

- **Para empezar:** Turso (más fácil)
- **Para producción seria:** PostgreSQL
- **Para tu caso actual:** Turso es perfecto

---

## 🆘 Troubleshooting

### Error: "Unable to connect to Turso"
- Verifica `TURSO_AUTH_TOKEN` en variables de entorno
- Asegúrate que `DATABASE_URL` sea la correcta

### Error: "module @libsql/client not found"
- Ejecuta `npm install @libsql/client` en backend
- Asegúrate que esté en `dependencies`, no `devDependencies`

### Error PostgreSQL: "column does not exist"
- Verifica que los nombres de columnas sean correctos
- PostgreSQL es case-sensitive

### Queries muy lentas
- Agrega índices a las columnas más consultadas
- En PostgreSQL: `CREATE INDEX idx_name ON table(column);`

---

## ✅ Siguiente Paso

Una vez elegida tu opción:
1. Sigue los pasos correspondientes
2. Ve a `QUICK_DEPLOY.md` para el deployment completo
3. ¡Tu app estará online en minutos!

**Recomiendo empezar con Turso - es la forma más rápida de estar online.** 🚀

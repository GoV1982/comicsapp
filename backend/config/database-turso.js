// backend/config/database-turso.js
// Adapter para Turso (SQLite Edge Database)
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({
    url: process.env.DATABASE_URL || 'file:./database.db',
    authToken: process.env.TURSO_AUTH_TOKEN
});

// Función helper para convertir rows de Turso al formato esperado
function convertRow(row) {
    if (!row) return null;
    const obj = {};
    for (const key in row) {
        obj[key] = row[key];
    }
    return obj;
}

const getAll = async (query, params = []) => {
    try {
        const result = await client.execute({
            sql: query,
            args: params
        });
        return result.rows.map(convertRow);
    } catch (error) {
        console.error('Error en getAll (Turso):', error);
        throw error;
    }
};

const getOne = async (query, params = []) => {
    try {
        const result = await client.execute({
            sql: query,
            args: params
        });
        return result.rows[0] ? convertRow(result.rows[0]) : null;
    } catch (error) {
        console.error('Error en getOne (Turso):', error);
        throw error;
    }
};

const runQuery = async (query, params = []) => {
    try {
        const result = await client.execute({
            sql: query,
            args: params
        });
        return {
            id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
            insertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
            changes: result.rowsAffected || 0
        };
    } catch (error) {
        console.error('Error en runQuery (Turso):', error);
        throw error;
    }
};

// Función para inicializar la base de datos en Turso
async function initDatabase() {
    try {
        console.log('🌐 Inicializando base de datos en Turso...');

        // Verificar si ya existe la tabla usuarios
        try {
            const result = await client.execute({
                sql: 'SELECT COUNT(*) as count FROM usuarios',
                args: []
            });

            const count = result.rows[0]?.count || result.rows[0]?.[0] || 0;
            console.log(`ℹ️  Base de datos Turso ya existe (${count} usuarios)`);

            // Crear usuario admin si no existe
            const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const adminName = process.env.ADMIN_NAME || 'Administrador';
            const adminEmail = process.env.ADMIN_EMAIL || '';

            const adminRow = await getOne('SELECT id FROM usuarios WHERE username = ?', [adminUsername]);

            if (!adminRow) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                await runQuery(
                    'INSERT INTO usuarios (username, password, nombre, email) VALUES (?, ?, ?, ?)',
                    [adminUsername, hashedPassword, adminName, adminEmail]
                );
                console.log('✅ Usuario admin creado en Turso');
                console.log(`   Usuario: ${adminUsername}`);
                console.log(`   Contraseña: ${adminPassword}`);
            } else {
                console.log('ℹ️  Usuario admin ya existe en Turso');
            }

        } catch (error) {
            console.error('❌ Error al verificar base de datos Turso:', error);
            console.log('⚠️  Asegúrate de que el schema esté creado en Turso');
            console.log('   Puedes usar el SQL Editor en el dashboard de Turso');
            throw error;
        }

    } catch (error) {
        console.error('❌ Error al inicializar Turso:', error);
        throw error;
    }
}

module.exports = {
    getAll,
    getOne,
    runQuery,
    initDatabase,
    client,
    db: client // Alias para compatibilidad
};

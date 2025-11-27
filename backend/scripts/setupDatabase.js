const { runQuery } = require('../config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log('🔄 Configurando base de datos...');

        // Eliminar tabla si existe
        await runQuery('DROP TABLE IF EXISTS usuarios');
        console.log('✅ Tabla anterior eliminada');

        // Crear tabla usuarios con estructura correcta
        await runQuery(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT NOT NULL,
                rol TEXT CHECK(rol IN ('admin', 'usuario')) DEFAULT 'usuario',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla usuarios creada');

        // Crear usuario admin
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await runQuery(`
            INSERT INTO usuarios (username, email, password, nombre, rol)
            VALUES (?, ?, ?, ?, ?)
        `, [
            process.env.ADMIN_USERNAME || 'Admin',
            process.env.ADMIN_EMAIL || 'admin@comiquería.com',
            hashedPassword,
            process.env.ADMIN_NAME || 'Administrador',
            'admin'
        ]);
        console.log('✅ Usuario admin creado');

        // Verificar estructura
        const estructura = await runQuery('pragma table_info(usuarios)');
        console.log('\n📋 Estructura de la tabla usuarios:');
        console.table(estructura);

        // Verificar usuario admin
        const admin = await runQuery('SELECT id, username, email, rol FROM usuarios');
        console.log('\n👤 Usuario admin creado:');
        console.table(admin);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

setupDatabase();
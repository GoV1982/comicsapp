const { getOne, runQuery } = require('../config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Verificar si el admin ya existe
        const adminExists = await getOne(
            'SELECT * FROM usuarios WHERE email = ?', 
            [process.env.ADMIN_EMAIL]
        );

        if (adminExists) {
            console.log('✅ Usuario admin ya existe');
            await runQuery(
                'UPDATE usuarios SET rol = ? WHERE email = ?',
                ['admin', process.env.ADMIN_EMAIL]
            );
            console.log('✅ Rol actualizado a admin');
            return;
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        // Crear usuario admin
        await runQuery(`
            INSERT INTO usuarios (username, email, password, nombre, rol) 
            VALUES (?, ?, ?, ?, ?)
        `, [
            process.env.ADMIN_USERNAME,
            process.env.ADMIN_EMAIL,
            hashedPassword,
            process.env.ADMIN_NAME,
            'admin'
        ]);

        console.log('✅ Usuario admin creado exitosamente');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createAdminUser();
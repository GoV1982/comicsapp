const { getOne } = require('../config/database');
require('dotenv').config();

async function checkAdmin() {
    try {
        console.log('🔍 Verificando usuario admin...');
        
        const admin = await getOne(
            'SELECT id, username, nombre, email FROM usuarios WHERE username = ?',
            [process.env.ADMIN_USERNAME]
        );

        if (admin) {
            console.log('✅ Usuario admin encontrado:', admin);
        } else {
            console.log('❌ Usuario admin NO encontrado');
            console.log('📝 Credenciales esperadas:', {
                username: process.env.ADMIN_USERNAME,
                nombre: process.env.ADMIN_NAME
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAdmin();
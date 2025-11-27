const { runQuery } = require('../config/database');

async function insertDefaultConfig() {
    try {
        console.log('🔄 Insertando configuración global por defecto...');

        // Verificar si ya existe una configuración
        const existing = await runQuery('SELECT id FROM configuracion_global WHERE id = 1');

        if (existing.length > 0) {
            console.log('ℹ️ La configuración global ya existe');
            return;
        }

        // Insertar configuración por defecto
        await runQuery(`
            INSERT INTO configuracion_global (
                id,
                tienda_nombre,
                email_contacto,
                whatsapp_numero,
                moneda,
                zona_horaria,
                facebook,
                instagram,
                twitter,
                logo_url
            ) VALUES (
                1,
                'Comics Store',
                'contacto@comicsstore.com',
                '5491234567890',
                'ARS',
                'America/Argentina/Buenos_Aires',
                'https://facebook.com/comicsstore',
                'https://instagram.com/comicsstore',
                'https://twitter.com/comicsstore',
                'https://comicsstore.com/logo.png'
            )
        `);

        console.log('✅ Configuración global por defecto insertada correctamente');

        // Verificar la inserción
        const config = await runQuery('SELECT * FROM configuracion_global WHERE id = 1');
        console.log('\n📋 Configuración insertada:');
        console.table(config);

    } catch (error) {
        console.error('❌ Error al insertar configuración por defecto:', error);
    }
}

insertDefaultConfig();

const { runQuery } = require('../config/database');

async function updateUsersTable() {
    try {
        console.log('🔄 Actualizando tabla usuarios...');

        // Verificar si la columna rol existe
        const checkColumn = await runQuery(`
            SELECT name FROM pragma_table_info('usuarios') 
            WHERE name = 'rol'
        `);

        if (checkColumn.length === 0) {
            // Agregar columna rol
            await runQuery(`
                ALTER TABLE usuarios 
                ADD COLUMN rol TEXT DEFAULT 'usuario' 
                CHECK(rol IN ('admin', 'usuario'))
            `);
            console.log('✅ Columna rol agregada correctamente');
        } else {
            console.log('ℹ️ La columna rol ya existe');
        }

    } catch (error) {
        console.error('❌ Error al actualizar tabla:', error);
    }
}

updateUsersTable();
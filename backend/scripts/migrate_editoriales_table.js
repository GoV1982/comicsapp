const { db } = require('../config/database');

console.log('Iniciando migración de tabla editoriales...');

try {
    // Verificar columnas existentes
    const tableInfo = db.prepare('PRAGMA table_info(editoriales)').all();
    const columns = tableInfo.map(col => col.name);

    if (!columns.includes('margen_ganancia')) {
        console.log('Agregando columna margen_ganancia...');
        db.exec('ALTER TABLE editoriales ADD COLUMN margen_ganancia REAL DEFAULT 0');
    }

    if (!columns.includes('email_contacto')) {
        console.log('Agregando columna email_contacto...');
        db.exec('ALTER TABLE editoriales ADD COLUMN email_contacto TEXT');
    }

    if (!columns.includes('whatsapp_contacto')) {
        console.log('Agregando columna whatsapp_contacto...');
        db.exec('ALTER TABLE editoriales ADD COLUMN whatsapp_contacto TEXT');
    }

    console.log('✅ Migración de editoriales completada correctamente');
} catch (error) {
    console.error('❌ Error durante la migración de editoriales:', error);
}

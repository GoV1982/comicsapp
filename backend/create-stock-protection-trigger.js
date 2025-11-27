// Script para crear el trigger de eliminación de stock
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔧 CREANDO TRIGGER DE PROTECCIÓN PARA STOCK\n');

// Crear el trigger
const triggerSQL = `
CREATE TRIGGER IF NOT EXISTS delete_stock_on_comic_delete
BEFORE DELETE ON comics
BEGIN
  DELETE FROM stock WHERE comic_id = OLD.id;
END;
`;

db.exec(triggerSQL, (err) => {
    if (err) {
        console.error('❌ Error al crear trigger:', err.message);
        db.close();
        return;
    }

    console.log('✅ Trigger creado exitosamente');
    console.log('\n📋 Funcionalidad:');
    console.log('   Cuando se elimine un comic, automáticamente se eliminará');
    console.log('   su registro de stock asociado, previniendo registros huérfanos.\n');

    // Verificar que el trigger fue creado
    db.all(`
    SELECT name, sql 
    FROM sqlite_master 
    WHERE type = 'trigger' 
    AND name = 'delete_stock_on_comic_delete'
  `, [], (err, rows) => {
        if (err) {
            console.error('❌ Error al verificar trigger:', err.message);
        } else if (rows.length > 0) {
            console.log('✅ Verificación: Trigger encontrado en la base de datos\n');
            console.log('SQL del trigger:');
            console.log(rows[0].sql);
        } else {
            console.log('⚠️  Advertencia: Trigger no encontrado en la verificación');
        }

        db.close();
        console.log('\n✨ Proceso completado\n');
    });
});

// Script de prueba del trigger
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🧪 PRUEBA DEL TRIGGER DE ELIMINACIÓN DE STOCK\n');

// 1. Crear un comic de prueba
const testComicSQL = `
  INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, estado)
  VALUES ('TEST COMIC - BORRAR', '999', 1, 100, 'Teste', 'Disponible')
`;

db.run(testComicSQL, function (err) {
    if (err) {
        console.error('❌ Error al crear comic de prueba:', err.message);
        db.close();
        return;
    }

    const testComicId = this.lastID;
    console.log(`✅ Comic de prueba creado (ID: ${testComicId})`);

    // 2. Verificar que se creó el stock automáticamente (trigger existente)
    db.get('SELECT * FROM stock WHERE comic_id = ?', [testComicId], (err, stock) => {
        if (err) {
            console.error('❌ Error al verificar stock:', err.message);
            db.close();
            return;
        }

        if (stock) {
            console.log(`✅ Stock creado automáticamente (ID: ${stock.id}, cantidad: ${stock.cantidad_disponible})`);

            // 3. Ahora eliminar el comic y verificar que se elimine el stock
            console.log(`\n🗑️  Eliminando comic de prueba...`);

            db.run('DELETE FROM comics WHERE id = ?', [testComicId], function (err) {
                if (err) {
                    console.error('❌ Error al eliminar comic:', err.message);
                    db.close();
                    return;
                }

                console.log(`✅ Comic eliminado`);

                // 4. Verificar que el stock también se eliminó
                db.get('SELECT * FROM stock WHERE comic_id = ?', [testComicId], (err, stockCheck) => {
                    if (err) {
                        console.error('❌ Error al verificar stock:', err.message);
                        db.close();
                        return;
                    }

                    if (stockCheck) {
                        console.log(`\n❌ FALLO: El stock NO se eliminó (ID: ${stockCheck.id})`);
                        console.log('   El trigger no está funcionando correctamente');
                    } else {
                        console.log(`\n✅ ÉXITO: El stock se eliminó automáticamente`);
                        console.log('   El trigger está funcionando correctamente ✨');
                    }

                    db.close();
                    console.log('\n🏁 Prueba completada\n');
                });
            });
        } else {
            console.log('⚠️  Stock no creado automáticamente');
            db.close();
        }
    });
});

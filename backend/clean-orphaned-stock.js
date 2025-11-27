// Script para limpiar registros huérfanos de stock
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🧹 LIMPIEZA DE REGISTROS HUÉRFANOS EN STOCK\n');

// Primero, mostrar qué se va a eliminar
db.all(`
  SELECT s.id, s.comic_id, s.cantidad_disponible
  FROM stock s
  LEFT JOIN comics c ON s.comic_id = c.id
  WHERE c.id IS NULL
`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }

    if (rows.length === 0) {
        console.log('✅ No hay registros huérfanos para eliminar');
        db.close();
        return;
    }

    console.log(`⚠️  Se encontraron ${rows.length} registros huérfanos:\n`);
    rows.forEach(row => {
        console.log(`   Stock ID: ${row.id}, Comic ID inexistente: ${row.comic_id}, Cantidad: ${row.cantidad_disponible}`);
    });

    const totalUnidades = rows.reduce((sum, r) => sum + r.cantidad_disponible, 0);
    console.log(`\n   Total de unidades fantasma: ${totalUnidades}\n`);

    // Eliminar los registros huérfanos
    db.run(`
    DELETE FROM stock
    WHERE id IN (
      SELECT s.id
      FROM stock s
      LEFT JOIN comics c ON s.comic_id = c.id
      WHERE c.id IS NULL
    )
  `, [], function (err) {
        if (err) {
            console.error('❌ Error al eliminar:', err.message);
            db.close();
            return;
        }

        console.log(`✅ Se eliminaron ${this.changes} registros huérfanos\n`);

        // Verificar el nuevo total
        db.get('SELECT COALESCE(SUM(cantidad_disponible), 0) as total FROM stock', [], (err, row) => {
            if (err) {
                console.error('❌ Error:', err.message);
            } else {
                console.log(`📊 Nuevo total de unidades: ${row.total}\n`);
            }
            db.close();
        });
    });
});

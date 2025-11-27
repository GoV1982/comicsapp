// Ver solo comics con stock > 0
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n📊 COMICS CON STOCK (solo cantidad > 0):\n');
console.log('ID\tTítulo\t\t\t\t\tCantidad');
console.log('─'.repeat(80));

db.all(`
  SELECT 
    s.id,
    c.titulo,
    s.cantidad_disponible
  FROM stock s
  INNER JOIN comics c ON s.comic_id = c.id
  WHERE s.cantidad_disponible > 0
  ORDER BY s.cantidad_disponible DESC
`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }

    if (rows.length === 0) {
        console.log('❌ No hay comics con stock disponible');
    } else {
        rows.forEach((row) => {
            const titulo = row.titulo.length > 40
                ? row.titulo.substring(0, 37) + '...'
                : row.titulo.padEnd(40);
            console.log(`${row.id}\t${titulo}\t${row.cantidad_disponible}`);
        });

        const total = rows.reduce((sum, row) => sum + row.cantidad_disponible, 0);
        console.log('─'.repeat(80));
        console.log(`✅ TOTAL: ${rows.length} comics con stock, ${total} unidades totales\n`);

        // Mostrar estadísticas
        const conMasDe5 = rows.filter(r => r.cantidad_disponible >= 5).length;
        const bajoStock = rows.filter(r => r.cantidad_disponible > 0 && r.cantidad_disponible < 5).length;

        console.log('📈 Estadísticas:');
        console.log(`   - Disponible (≥5 unidades): ${conMasDe5}`);
        console.log(`   - Bajo stock (1-4 unidades): ${bajoStock}`);
        console.log(`   - Sin stock: ${3495 - rows.length}\n`);
    }

    db.close();
});

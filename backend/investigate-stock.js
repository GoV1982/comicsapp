// Ver TODO el stock, incluyendo registros sin comic asociado
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔍 INVESTIGANDO: ¿Dónde están las 15 unidades faltantes?\n');

// Consulta 1: Total directo de la tabla stock
db.get('SELECT SUM(cantidad_disponible) as total FROM stock', [], (err, row) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }
    console.log(`1️⃣  SUM directo de stock.cantidad_disponible: ${row.total}`);
});

// Consulta 2: Con INNER JOIN (lo que mostramos en la UI)
db.get(`
  SELECT SUM(s.cantidad_disponible) as total
  FROM stock s
  INNER JOIN comics c ON s.comic_id = c.id
`, [], (err, row) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }
    console.log(`2️⃣  SUM con INNER JOIN a comics: ${row.total}`);
});

// Consulta 3: Registros de stock SIN comic asociado
db.all(`
  SELECT s.id, s.comic_id, s.cantidad_disponible
  FROM stock s
  LEFT JOIN comics c ON s.comic_id = c.id
  WHERE c.id IS NULL AND s.cantidad_disponible > 0
`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }
    if (rows.length > 0) {
        console.log(`\n3️⃣  ⚠️  Registros de stock SIN comic asociado:`);
        rows.forEach(row => {
            console.log(`   Stock ID: ${row.id}, Comic ID: ${row.comic_id}, Cantidad: ${row.cantidad_disponible}`);
        });
        const total = rows.reduce((sum, r) => sum + r.cantidad_disponible, 0);
        console.log(`   Total en registros huérfanos: ${total}`);
    } else {
        console.log(`\n3️⃣  ✅ No hay registros de stock sin comic asociado`);
    }

    // Consulta 4: Ver todos los stock con cantidad > 0
    db.all(`SELECT id, comic_id, cantidad_disponible FROM stock WHERE cantidad_disponible > 0 ORDER BY id`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
            return;
        }
        console.log(`\n4️⃣  Todos los registros de stock con cantidad > 0:`);
        let total = 0;
        rows.forEach(row => {
            console.log(`   Stock ID: ${row.id}, Comic ID: ${row.comic_id}, Cantidad: ${row.cantidad_disponible}`);
            total += row.cantidad_disponible;
        });
        console.log(`   \n   TOTAL CALCULADO: ${total} unidades`);
        console.log(`   REGISTROS: ${rows.length}`);

        db.close();
    });
});

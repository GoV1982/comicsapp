// Ejecutar la MISMA consulta que usa getStockSummary
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔍 Ejecutando la MISMA consulta que getStockSummary:\n');

const query = `
  SELECT
    COUNT(*) as total_items,
    COALESCE(SUM(cantidad_disponible), 0) as total_unidades,
    SUM(CASE WHEN cantidad_disponible = 0 THEN 1 ELSE 0 END) as sin_stock,
    SUM(CASE WHEN cantidad_disponible > 0 AND cantidad_disponible < 5 THEN 1 ELSE 0 END) as bajo_stock
  FROM stock
`;

db.get(query, [], (err, row) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }

    console.log('Resultados de la consulta SQL:');
    console.log(JSON.stringify(row, null, 2));

    console.log('\n📊 Valores:');
    console.log(`   total_items: ${row.total_items} (type: ${typeof row.total_items})`);
    console.log(`   total_unidades: ${row.total_unidades} (type: ${typeof row.total_unidades})`);
    console.log(`   sin_stock: ${row.sin_stock}`);
    console.log(`   bajo_stock: ${row.bajo_stock}`);

    console.log('\n🔍 Después de parseInt:');
    console.log(`   parseInt(total_unidades): ${parseInt(row.total_unidades)}`);

    db.close();
});

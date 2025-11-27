const { runQuery } = require('../config/database');

async function updateConfiguracionGlobalTable() {
  try {
    console.log('🔄 Actualizando tabla configuracion_global...');

    const columnsToAdd = [
      { name: 'facebook', type: 'TEXT' },
      { name: 'instagram', type: 'TEXT' },
      { name: 'twitter', type: 'TEXT' },
      { name: 'logo_url', type: 'TEXT' },
      { name: 'descripcion_tienda', type: 'TEXT' },
      { name: 'direccion', type: 'TEXT' },
      { name: 'telefono', type: 'TEXT' },
      { name: 'horario_atencion', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      const checkColumn = await runQuery(
        'SELECT name FROM pragma_table_info("configuracion_global") WHERE name = ?',
        [column.name]
      );

      if (checkColumn.length === 0) {
        await runQuery(
          `ALTER TABLE configuracion_global ADD COLUMN ${column.name} ${column.type}`
        );
        console.log(`✅ Columna ${column.name} agregada correctamente`);
      } else {
        console.log(`ℹ️ La columna ${column.name} ya existe`);
      }
    }
  } catch (error) {
    console.error('❌ Error al actualizar tabla configuracion_global:', error);
  }
}

updateConfiguracionGlobalTable();

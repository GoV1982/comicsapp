const { runQuery } = require('../config/database');

async function createConfiguracionGlobalTable() {
  try {
    console.log('🔄 Creating configuracion_global table if not exists...');
    const sql = "CREATE TABLE IF NOT EXISTS configuracion_global (" +
      "id INTEGER PRIMARY KEY, " +
      "whatsapp_numero TEXT, " +
      "tienda_nombre TEXT NOT NULL, " +
      "email_contacto TEXT NOT NULL, " +
      "moneda TEXT, " +
      "zona_horaria TEXT, " +
      "facebook TEXT, " +
      "instagram TEXT, " +
      "twitter TEXT, " +
      "logo_url TEXT, " +
      "descripcion_tienda TEXT, " +
      "direccion TEXT, " +
      "telefono TEXT, " +
      "horario_atencion TEXT" +
      ")";
    await runQuery(sql);
    console.log('✅ configuracion_global table is ready.');
  } catch (error) {
    console.error('❌ Error creating configuracion_global table:', error);
  }
}

createConfiguracionGlobalTable();

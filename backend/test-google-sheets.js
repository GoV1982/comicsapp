const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Google Sheets API...\n');

    // Verificar que el archivo de credenciales existe
    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || path.join(__dirname, 'service-account-key.json');
    if (!fs.existsSync(keyFile)) {
      throw new Error('Archivo de credenciales no encontrado: ' + keyFile);
    }

    console.log('✅ Archivo de credenciales encontrado:', keyFile);

    // Verificar que el SPREADSHEET_ID esté configurado
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID') {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado correctamente. Valor actual: ' + (spreadsheetId || 'NO DEFINIDO'));
    }

    console.log('✅ SPREADSHEET_ID configurado:', spreadsheetId);

    // Intentar autenticar
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('✅ Autenticación configurada');

    // Intentar obtener información de la spreadsheet
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log('✅ Conexión exitosa con Google Sheets!');
    console.log('📊 Spreadsheet:', response.data.properties.title);
    console.log('🆔 ID:', response.data.spreadsheetId);

    // Intentar leer una hoja de prueba
    try {
      const testRange = 'Comics!A1:B2';
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: testRange,
      });

      console.log('✅ Lectura de datos exitosa');
      console.log('📋 Datos encontrados:', readResponse.data.values ? readResponse.data.values.length + ' filas' : 'Sin datos');

      if (readResponse.data.values && readResponse.data.values.length > 0) {
        console.log('📋 Primeras filas:');
        readResponse.data.values.slice(0, 3).forEach((row, index) => {
          console.log(`   Fila ${index + 1}:`, row);
        });
      }

    } catch (readError) {
      console.log('⚠️  No se pudo leer datos (posiblemente la hoja "Comics" no existe):', readError.message);
      console.log('💡 Asegúrate de crear una hoja llamada "Comics" en tu spreadsheet');
    }

    console.log('\n🎉 ¡La conexión con Google Sheets está funcionando correctamente!');

  } catch (error) {
    console.error('\n❌ Error en la conexión:', error.message);

    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verifica que el archivo service-account-key.json sea válido');
      console.log('   - Asegúrate de que la service account tenga permisos de Editor en la spreadsheet');
    } else if (error.message.includes('Spreadsheet not found')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verifica que el GOOGLE_SHEETS_SPREADSHEET_ID sea correcto');
      console.log('   - Asegúrate de que la spreadsheet no haya sido eliminada');
    }

    process.exit(1);
  }
}

testConnection();

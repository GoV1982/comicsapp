// Script para verificar configuración de Google Sheets
require('dotenv').config();

console.log('\n🔍 Verificando configuración de Google Sheets...\n');
console.log('='.repeat(60));

// Verificar variables de entorno
console.log('\n📋 Variables de entorno:\n');

const hasSpreadsheetId = !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const hasServiceAccountKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const hasServiceAccountKeyFile = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log(`  NODE_ENV: ${nodeEnv}`);
console.log(`  GOOGLE_SHEETS_SPREADSHEET_ID: ${hasSpreadsheetId ? '✅ Configurado' : '❌ No configurado'}`);

if (hasSpreadsheetId) {
    console.log(`    → Valor: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}`);
}

console.log(`  GOOGLE_SERVICE_ACCOUNT_KEY: ${hasServiceAccountKey ? '✅ Configurado (JSON en variable)' : '⚠️  No configurado'}`);

if (hasServiceAccountKey) {
    const keyLength = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length;
    console.log(`    → Longitud: ${keyLength} caracteres`);
}

console.log(`  GOOGLE_SERVICE_ACCOUNT_KEY_FILE: ${hasServiceAccountKeyFile ? `✅ Configurado` : '⚠️  No configurado'}`);

if (hasServiceAccountKeyFile) {
    console.log(`    → Archivo: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE}`);
}

// Intentar parsear el JSON si existe
console.log('\n🔑 Validación de credenciales:\n');

if (hasServiceAccountKey) {
    try {
        const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('  ✅ JSON de credenciales válido');
        console.log(`    → Project ID: ${creds.project_id}`);
        console.log(`    → Client Email: ${creds.client_email}`);
        console.log(`    → Type: ${creds.type}`);
    } catch (error) {
        console.log('  ❌ Error parseando JSON de credenciales');
        console.log(`    → Error: ${error.message}`);
    }
} else {
    console.log('  ⚠️  No hay JSON de credenciales en variable de entorno');
}

// Verificar archivo local
console.log('\n📁 Verificación de archivo local:\n');

const fs = require('fs');
const path = require('path');
const keyFilePath = path.join(__dirname, 'service-account-key.json');

if (fs.existsSync(keyFilePath)) {
    console.log('  ✅ Archivo service-account-key.json existe');
    const stats = fs.statSync(keyFilePath);
    console.log(`    → Tamaño: ${stats.size} bytes`);
    console.log(`    → Ruta: ${keyFilePath}`);

    // Intentar leer y parsear
    try {
        const fileContent = fs.readFileSync(keyFilePath, 'utf8');
        const creds = JSON.parse(fileContent);
        console.log('  ✅ Contenido del archivo es JSON válido');
        console.log(`    → Project ID: ${creds.project_id}`);
        console.log(`    → Client Email: ${creds.client_email}`);
    } catch (error) {
        console.log('  ❌ Error leyendo/parseando archivo');
        console.log(`    → Error: ${error.message}`);
    }
} else {
    console.log('  ⚠️  Archivo service-account-key.json NO encontrado');
    console.log(`    → Buscado en: ${keyFilePath}`);
}

// Análisis y recomendaciones
console.log('\n' + '='.repeat(60));
console.log('\n📊 Análisis y Recomendaciones:\n');

if (nodeEnv === 'production') {
    console.log('  🏭 Entorno: PRODUCCIÓN\n');

    if (!hasServiceAccountKey) {
        console.log('  ❌ PROBLEMA: En producción debes usar GOOGLE_SERVICE_ACCOUNT_KEY');
        console.log('     Solución: Agrega el JSON completo como variable de entorno');
    } else if (!hasSpreadsheetId) {
        console.log('  ❌ PROBLEMA: Falta GOOGLE_SHEETS_SPREADSHEET_ID');
        console.log('     Solución: Agrega el ID de tu Google Sheet');
    } else {
        console.log('  ✅ Configuración correcta para producción');
    }
} else {
    console.log('  💻 Entorno: DESARROLLO\n');

    if (!hasServiceAccountKey && !hasServiceAccountKeyFile && !fs.existsSync(keyFilePath)) {
        console.log('  ❌ PROBLEMA: No hay credenciales configuradas');
        console.log('     Opciones:');
        console.log('       1. Coloca service-account-key.json en /backend');
        console.log('       2. Define GOOGLE_SERVICE_ACCOUNT_KEY_FILE en .env');
        console.log('       3. Define GOOGLE_SERVICE_ACCOUNT_KEY en .env');
    } else {
        console.log('  ✅ Tienes al menos un método de autenticación configurado');
    }

    if (!hasSpreadsheetId) {
        console.log('\n  ⚠️  ADVERTENCIA: Falta GOOGLE_SHEETS_SPREADSHEET_ID');
        console.log('     Agrega el ID de tu Google Sheet en .env');
    }
}

// Instrucciones de uso
console.log('\n💡 Métodos de autenticación (en orden de prioridad):\n');
console.log('  1. GOOGLE_SERVICE_ACCOUNT_KEY (variable con JSON completo)');
console.log('     → Recomendado para PRODUCCIÓN');
console.log('  2. GOOGLE_SERVICE_ACCOUNT_KEY_FILE (ruta al archivo .json)');
console.log('     → Útil para desarrollo con archivo en otra ubicación');
console.log('  3. service-account-key.json (archivo por defecto)');
console.log('     → Útil para desarrollo local');

console.log('\n📝 Próximos pasos:\n');

if (!hasServiceAccountKey && nodeEnv === 'production') {
    console.log('  1. Convierte service-account-key.json a una línea:');
    console.log('     PowerShell: (Get-Content service-account-key.json -Raw) -replace "`n", ""');
    console.log('  2. Copia el resultado');
    console.log('  3. Agrégalo como GOOGLE_SERVICE_ACCOUNT_KEY en Render');
}

if (!hasSpreadsheetId) {
    console.log('  1. Abre tu Google Sheet');
    console.log('  2. Copia el ID de la URL (entre /d/ y /edit)');
    console.log('  3. Agrégalo como GOOGLE_SHEETS_SPREADSHEET_ID');
}

if (hasServiceAccountKey || hasServiceAccountKeyFile || fs.existsSync(keyFilePath)) {
    if (hasSpreadsheetId) {
        console.log('  ✅ ¡Todo configurado! Puedes usar Google Sheets API');
    }
}

console.log('\n' + '='.repeat(60) + '\n');

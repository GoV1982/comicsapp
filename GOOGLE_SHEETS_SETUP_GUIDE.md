# 🔐 Guía Paso a Paso: Configurar Google Sheets con Variables de Entorno

Esta guía te ayudará a configurar Google Sheets API de forma segura usando variables de entorno en Render.

---

## ✅ PASO 1: Convertir service-account-key.json a String (EN TU MÁQUINA LOCAL)

### Opción A: Usando PowerShell (Windows)

```powershell
# En PowerShell, navega a la carpeta backend
cd backend

# Convertir el JSON a una sola línea
$json = (Get-Content service-account-key.json -Raw) -replace "`n", "" -replace "`r", ""

# Copiar al clipboard
$json | Set-Clipboard

# Verificar (mostrar primeros 100 caracteres)
$json.Substring(0, 100)
```

**Resultado esperado:**
```
{"type":"service_account","project_id":"tu-proyecto","private_key_id":"abc123",...}
```

✅ **El JSON completo ya está copiado en tu portapapeles**

### Opción B: Manual (Si la opción A no funciona)

1. Abre `backend/service-account-key.json` con Notepad
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)
3. Pégalo en un editor online de minificación JSON: https://codebeautify.org/json-minifier
4. Click "Minify" - te dará el JSON en una sola línea
5. Copia el resultado

---

## ✅ PASO 2: Actualizar el Código Backend (MODIFICAR 1 ARCHIVO)

Vamos a modificar `googleSheetsController.js` para soportar ambos métodos:

### Editar: `backend/controllers/googleSheetsController.js`

**REEMPLAZA la función `getAuthClient` (líneas 9-15) con esta versión mejorada:**

```javascript
// Función para autenticar con Google
async function getAuthClient() {
    let credentials;
    
    // Opción 1: Variable de entorno con JSON completo (PRODUCCIÓN)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
            credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            console.log('🔐 Usando credenciales de Google desde variable de entorno');
        } catch (error) {
            console.error('❌ Error parseando GOOGLE_SERVICE_ACCOUNT_KEY:', error.message);
            throw new Error('Credenciales de Google inválidas en variable de entorno');
        }
    }
    // Opción 2: Archivo local (DESARROLLO)
    else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
        const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
        credentials = require(keyFile);
        console.log('🔐 Usando credenciales de Google desde archivo:', keyFile);
    }
    // Opción 3: Fallback a archivo por defecto
    else {
        try {
            credentials = require('./service-account-key.json');
            console.log('🔐 Usando credenciales de Google desde ./service-account-key.json');
        } catch (error) {
            console.warn('⚠️  Google Sheets API no configurada. Las funciones de Sheets no funcionarán.');
            return null;
        }
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
    
    return auth;
}
```

**También actualiza TODAS las funciones que usan `getAuthClient()` para manejar el caso null:**

Por ejemplo, la función `getSheetData` (línea 18):

```javascript
async function getSheetData(range) {
    try {
        const auth = await getAuthClient();
        
        // Si no hay auth configurado, retornar array vacío
        if (!auth) {
            console.warn('⚠️  Google Sheets no configurado. Retornando datos vacíos.');
            return [];
        }
        
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        return response.data.values || [];
    } catch (error) {
        console.error('Error al obtener datos de Google Sheets:', error);
        throw error;
    }
}
```

**Haz lo mismo para `updateSheetData`, `appendSheetData` y `clearSheet`.**

---

## ✅ PASO 3: Crear Script Helper (FACILITA EL TESTING LOCAL)

Crear archivo: `backend/test-google-sheets-config.js`

```javascript
// Script para verificar configuración de Google Sheets
require('dotenv').config();

console.log('\n🔍 Verificando configuración de Google Sheets...\n');

// Verificar variables de entorno
console.log('Variables de entorno:');
console.log('  GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Configurado' : '❌ No configurado');
console.log('  GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Configurado (JSON en variable)' : '⚠️  No configurado');
console.log('  GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? `✅ Configurado (${process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE})` : '⚠️  No configurado');

// Intentar parsear el JSON si existe
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
        const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log('\n✅ JSON de credenciales válido');
        console.log('  Project ID:', creds.project_id);
        console.log('  Client Email:', creds.client_email);
    } catch (error) {
        console.log('\n❌ Error parseando JSON de credenciales:', error.message);
    }
}

// Verificar archivo local
const fs = require('fs');
const path = require('path');
const keyFilePath = path.join(__dirname, 'service-account-key.json');

if (fs.existsSync(keyFilePath)) {
    console.log('\n✅ Archivo service-account-key.json existe localmente');
} else {
    console.log('\n⚠️  Archivo service-account-key.json NO encontrado localmente');
}

console.log('\n📋 Recomendación:');
if (process.env.NODE_ENV === 'production') {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('  ❌ En PRODUCCIÓN debes usar GOOGLE_SERVICE_ACCOUNT_KEY');
    } else {
        console.log('  ✅ Configuración correcta para producción');
    }
} else {
    console.log('  ℹ️  En DESARROLLO puedes usar archivo local o variable de entorno');
}

console.log('\n');
```

Probar localmente:
```bash
node backend/test-google-sheets-config.js
```

---

## ✅ PASO 4: Configurar Variables de Entorno en Render

### 4.1 Ir a Render Dashboard

1. Abre https://dashboard.render.com
2. Selecciona tu servicio backend
3. Ve a "Environment" en el menú lateral

### 4.2 Agregar Variables de Entorno

Click en "Add Environment Variable" y agrega las siguientes:

#### Variable 1: GOOGLE_SERVICE_ACCOUNT_KEY
```
Key: GOOGLE_SERVICE_ACCOUNT_KEY
Value: <PEGA AQUÍ EL JSON COMPLETO QUE COPIASTE EN EL PASO 1>
```

**Ejemplo del valor (NO uses este, usa el tuyo):**
```json
{"type":"service_account","project_id":"tu-proyecto-123","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"tu-service-account@tu-proyecto.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

#### Variable 2: GOOGLE_SHEETS_SPREADSHEET_ID
```
Key: GOOGLE_SHEETS_SPREADSHEET_ID
Value: <TU_SPREADSHEET_ID>
```

**¿Cómo obtener el SPREADSHEET_ID?**
1. Abre tu Google Sheet
2. Mira la URL: `https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit`
3. El ID es: `1ABC123XYZ456` (la parte entre /d/ y /edit)

### 4.3 Guardar y Redeploy

1. Click "Save Changes"
2. Render automáticamente re-deployará tu aplicación
3. Espera ~5 minutos

---

## ✅ PASO 5: Verificar en Producción

### 5.1 Revisar Logs

En Render dashboard:
1. Ve a tu servicio backend
2. Click en "Logs"
3. Busca mensajes como:
   ```
   🔐 Usando credenciales de Google desde variable de entorno
   ```

### 5.2 Test Endpoint

Prueba que funcione:
```bash
# Reemplaza con tu URL de Render
curl https://tu-backend.onrender.com/api/sheets/comics/import \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -d '{"sheetName":"Comics"}'
```

---

## ✅ PASO 6: Mantener Seguridad (IMPORTANTE)

### ✅ Verificar .gitignore

Asegúrate que estos archivos NO estén en Git:

```gitignore
# Archivo .gitignore
service-account-key.json
*.json (excepto package.json)
.env
.env.local
.env.production
```

### ✅ Rotar Credenciales (Si se expusieron)

Si accidentalmente subiste las credenciales a Git:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. IAM & Admin → Service Accounts
3. Encuentra tu service account
4. Click en "Keys" → Elimina la key antigua
5. "Add Key" → "Create new key" → JSON
6. Descarga el nuevo archivo
7. Actualiza la variable en Render

---

## 🎯 Resumen de Variables de Entorno

### Desarrollo (.env local):
```env
NODE_ENV=development
GOOGLE_SHEETS_SPREADSHEET_ID=tu_id_aqui
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account-key.json
```

### Producción (Render):
```env
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=tu_id_aqui
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 🔧 Troubleshooting

### Error: "JSON inválido"
**Problema:** El JSON tiene saltos de línea o caracteres especiales
**Solución:** Asegúrate de minificar el JSON (quitar saltos de línea)

### Error: "Missing credentials"
**Problema:** Variable no configurada en Render
**Solución:** Verifica que `GOOGLE_SERVICE_ACCOUNT_KEY` esté en Environment Variables

### Error: "Permission denied"
**Problema:** Service account no tiene acceso al spreadsheet
**Solución:**
1. Abre tu Google Sheet
2. Click "Share"
3. Agrega el email del service account (ej: `mi-service@proyecto.iam.gserviceaccount.com`)
4. Dale permisos de "Editor"

### Google Sheets no funciona pero todo lo demás sí
**Solución:** Es opcional! Tu app funciona sin Google Sheets, simplemente no podrás importar/exportar

---

## ✅ Checklist Final

- [ ] Copié el JSON completo de service-account-key.json
- [ ] El JSON está en una sola línea (minificado)
- [ ] Actualicé `getAuthClient()` en googleSheetsController.js
- [ ] Agregué `GOOGLE_SERVICE_ACCOUNT_KEY` en Render
- [ ] Agregué `GOOGLE_SHEETS_SPREADSHEET_ID` en Render
- [ ] Service account tiene acceso al Google Sheet (compartido)
- [ ] Render re-deployó exitosamente
- [ ] Verifiqué los logs - veo "Usando credenciales de Google desde variable de entorno"
- [ ] service-account-key.json NO está en Git

---

¡Listo! Ahora Google Sheets funciona de forma segura en producción. 🎉

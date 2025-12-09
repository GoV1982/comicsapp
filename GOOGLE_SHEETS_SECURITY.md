# ⚠️ IMPORTANTE: Configuración de Google Sheets en Producción

## 🔒 Seguridad del Service Account Key

El archivo `backend/service-account-key.json` contiene credenciales privadas de Google Cloud y **NO debe subirse a Git**.

### ✅ Ya está protegido:
- ✅ Está en `.gitignore`
- ✅ Fue removido del historial de Git
- ✅ GitHub no permitirá subirlo

---

## 🔧 Cómo Configurar Google Sheets API en Producción

Tienes 2 opciones para usar Google Sheets en tu aplicación desplegada:

### **Opción A: Variables de Entorno (RECOMENDADA)** 

En lugar de subir el archivo JSON, convierte su contenido en una variable de entorno.

#### 1. Convertir JSON a String

```bash
# En tu máquina local, desde la carpeta backend:
# Windows PowerShell:
$json = Get-Content service-account-key.json -Raw
$json -replace "`n", "" -replace "`r", ""

# O simplemente abre el archivo y copia TODO el contenido en una sola línea
```

#### 2. En Render, agregar como Variable de Entorno

```
Nombre: GOOGLE_SERVICE_ACCOUNT_KEY
Valor: {"type":"service_account","project_id":"...todo_el_json_aqui..."}
```

#### 3. Actualizar código backend

En `backend/server.js` o donde inicialices Google Sheets:

```javascript
const { google } = require('googleapis');

// Obtener credenciales desde variable de entorno
let credentials;
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // Producción: desde variable de entorno
  credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
} else {
  // Desarrollo: desde archivo local
  credentials = require('./service-account-key.json');
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
```

---

### **Opción B: Deshabilitar en Producción (SI NO LO USAS MUCHO)**

Si Google Sheets no es crítico, simplemente deshabilítalo en producción:

```javascript
// En backend/routes/googleSheets.js o similar
if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.log('⚠️  Google Sheets API deshabilitada en producción');
  // Retornar respuestas vacías o errores informativos
}
```

---

## 📋 Variables de Entorno Necesarias en Render

Para usar Google Sheets en producción, necesitas:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id_aqui
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Cómo obtener SPREADSHEET_ID:

1. Abre tu Google Sheet
2. La URL será algo como: `https://docs.google.com/spreadsheets/d/1ABC123XYZ456/edit`
3. El ID es: `1ABC123XYZ456`

---

## 🔐 Buenas Prácticas

### ✅ HACER:
- Mantener `service-account-key.json` solo en tu máquina local
- Usar variables de entorno en producción
- Rotar credenciales si se expusieron
- Limitar permisos del service account solo a lo necesario

### ❌ NO HACER:
- Subir `service-account-key.json` a Git
- Compartir el archivo por email o chat
- Dejar el archivo en repositorios públicos
- Usar la misma cuenta para desarrollo y producción

---

## 🆘 Si el Archivo ya se Expuso

Si ya subiste el archivo a GitHub (ya lo limpiamos, pero por si acaso):

### 1. Revocar las Credenciales

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a "IAM & Admin" → "Service Accounts"
3. Encuentra tu service account
4. Click en "Keys" → Elimina la key expuesta
5. Crea una nueva key

### 2. Actualizar Localmente

```bash
# Descargar el nuevo service-account-key.json
# Reemplazar el archivo local
# NO subirlo a Git
```

### 3. Actualizar en Render

Actualizar la variable `GOOGLE_SERVICE_ACCOUNT_KEY` con el nuevo JSON.

---

## 📚 Recursos

- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## ✅ Checklist

Antes de usar Google Sheets en producción:

- [ ] `service-account-key.json` está en `.gitignore`
- [ ] El archivo NO está en GitHub
- [ ] Tienes el contenido guardado localmente de forma segura
- [ ] Decidiste entre Opción A (variables de entorno) u Opción B (deshabilitar)
- [ ] Si usas Opción A, agregaste `GOOGLE_SERVICE_ACCOUNT_KEY` en Render
- [ ] Agregaste `GOOGLE_SHEETS_SPREADSHEET_ID` en Render
- [ ] Probaste que funciona en producción

---

**Nota:** El sistema funciona perfectamente SIN Google Sheets. Solo lo necesitas si quieres sincronizar datos con una hoja de cálculo de Google.

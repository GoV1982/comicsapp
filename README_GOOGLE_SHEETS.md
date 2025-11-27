# Integración con Google Sheets para Comics

Esta guía explica cómo configurar y usar la funcionalidad de importación/exportación de comics usando Google Sheets.

## Configuración Inicial

### 1. Crear un Proyecto en Google Cloud Platform

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google Sheets API:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API"
   - Haz clic en "Enable"

### 2. Crear una Service Account

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "Service Account"
3. Completa los detalles:
   - **Service account name**: `comics-app-service`
   - **Service account ID**: se generará automáticamente
   - **Description**: `Service account for comics app Google Sheets integration`
4. Haz clic en "Create and Continue"
5. Otorga el rol "Editor" para que pueda leer/escribir en Sheets
6. Haz clic en "Done"

### 3. Generar la Key de la Service Account

1. En la lista de service accounts, haz clic en la que acabas de crear
2. Ve a la pestaña "Keys"
3. Haz clic en "Add Key" > "Create new key"
4. Selecciona "JSON" como tipo de key
5. Descarga el archivo JSON (se guardará automáticamente)

### 4. Crear la Spreadsheet en Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva spreadsheet
3. Copia el ID de la spreadsheet desde la URL (la parte entre `/d/` y `/edit`)
   - URL ejemplo: `https://docs.google.com/spreadsheets/d/1ABC123...XYZ/edit`
   - ID: `1ABC123...XYZ`

### 5. Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env` en la carpeta `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edita el archivo `.env` con tus valores:
   ```env
   # Google Sheets API
   GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id_aqui
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account-key.json
   ```

3. Mueve el archivo JSON descargado a `backend/service-account-key.json`

### 6. Compartir la Spreadsheet

1. En Google Sheets, haz clic en "Share"
2. Agrega el email de la service account (termina en `@gserviceaccount.com`)
3. Otorga permisos de "Editor"

## Estructura de Datos en Google Sheets

La spreadsheet debe tener una hoja llamada "Comics" con las siguientes columnas (fila 1 como headers):

| Título | Número Edición | Editorial | Precio | Género | Subgénero | Imagen URL | Descripción | Estado |
|--------|----------------|-----------|--------|--------|-----------|------------|-------------|--------|
| Batman #1 | 1 | DC Comics | 15.99 | Superhéroes | Acción | https://... | Descripción... | Disponible |

**Notas importantes:**
- Los headers deben estar exactamente en la fila 1
- Los datos comienzan desde la fila 2
- Las columnas son obligatorias: Título, Número Edición, Editorial, Precio, Género
- Las demás columnas son opcionales
- Si una editorial no existe, se creará automáticamente

## Uso de la Funcionalidad

### Desde la Interfaz de Administración

1. Ve a la sección "Comics" en el panel de administración
2. Verás tres nuevos botones junto a "Nuevo Comic":

#### Importar desde Google Sheets
- Lee los datos desde la spreadsheet y los importa a la base de datos
- Crea editoriales automáticamente si no existen
- Muestra un resumen de importados y errores

#### Exportar a Google Sheets
- Exporta todos los comics de la base de datos a la spreadsheet
- **Sobrescribe completamente** los datos existentes en la hoja
- Incluye headers y todos los campos

#### Sincronizar (Sync)
- Realiza importación y exportación en ambas direcciones
- Útil para mantener la base de datos y Sheets sincronizados

### Consideraciones de Seguridad

- **Siempre confirma las acciones**: Los botones muestran mensajes de confirmación
- **Backup recomendado**: Haz backup de tu base de datos antes de importar grandes cantidades de datos
- **Permisos limitados**: La service account solo tiene acceso a la spreadsheet específica
- **Validación de datos**: El sistema valida los datos antes de insertarlos

## Solución de Problemas

### Error: "The caller does not have permission"
- Verifica que la service account tenga permisos de "Editor" en la spreadsheet
- Asegúrate de que el email de la service account esté correcto

### Error: "Spreadsheet not found"
- Verifica que el `GOOGLE_SHEETS_SPREADSHEET_ID` sea correcto
- Asegúrate de que la spreadsheet no haya sido eliminada

### Error: "Invalid JSON payload"
- Verifica que el archivo `service-account-key.json` sea válido
- Asegúrate de que la ruta en `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` sea correcta

### Datos no se importan correctamente
- Verifica que los headers estén en la fila 1 exactamente como se especifica
- Asegúrate de que no haya filas vacías al inicio
- Revisa el formato de números (precio debe ser numérico)

## Funcionalidades Avanzadas

### Automatización
Puedes configurar sincronizaciones automáticas usando cron jobs o servicios como Google Cloud Scheduler.

### Múltiples Hojas
El sistema está preparado para trabajar con diferentes hojas dentro de la misma spreadsheet cambiando el parámetro `sheetName`.

### Backup Automático
La funcionalidad de exportación puede usarse para crear backups automáticos de tu catálogo.

## Soporte

Si encuentras problemas:
1. Revisa los logs del servidor (backend)
2. Verifica la configuración de Google Cloud Console
3. Confirma que todos los archivos de configuración estén en su lugar
4. Revisa que las variables de entorno estén correctamente configuradas

# 🚀 Guía de Deployment - Comiquería Online

Esta guía te ayudará a publicar tu aplicación web de forma **GRATUITA** en internet.

## 📋 Índice
1. [Preparación del Código para Producción](#preparación)
2. [Opciones de Hosting Gratuitas](#opciones-hosting)
3. [Deployment Recomendado (Opción A)](#opción-a-recomendada)
4. [Deployment Alternativo (Opción B)](#opción-b-alternativa)
5. [Configuración de Base de Datos](#base-de-datos)
6. [Variables de Entorno](#variables-entorno)
7. [Mantenimiento Post-Deployment](#mantenimiento)

---

## 🔧 Preparación del Código para Producción {#preparación}

### 1. Backend - Preparación

#### 1.1. Crear archivo de configuración de producción

Crea `backend/.env.production`:
```env
# Base de datos - Turso o PostgreSQL
DB_PATH=./database.sqlite  # Solo si usas SQLite local
DATABASE_URL=your_production_database_url  # Para PostgreSQL/Turso

# JWT Secret - IMPORTANTE: Genera uno nuevo y seguro
JWT_SECRET=tu_clave_super_secreta_y_larga_para_produccion

# Puerto
PORT=3002

# Ambiente
NODE_ENV=production

# Google Sheets API (opcional)
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
```

#### 1.2. Actualizar `package.json` del backend

Agrega estos scripts:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "build": "echo 'No build needed for Node.js'",
  "migrate": "node scripts/migrate.js"
}
```

#### 1.3. Agregar archivo `backend/.gitignore`
```
node_modules/
.env
.env.local
database.db
service-account-key.json
*.log
```

### 2. Frontend - Preparación

#### 2.1. Actualizar `frontend/.env.production`

Crea este archivo:
```env
VITE_API_URL=https://tu-backend-url.com/api
```

#### 2.2. Verificar que `vite.config.js` tenga configuración correcta

El archivo ya debería estar bien, verifica:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 🌐 Opciones de Hosting Gratuitas {#opciones-hosting}

### Frontend (React/Vite)

| Servicio | Pros | Contras | Plan Gratuito |
|----------|------|---------|---------------|
| **Vercel** ⭐ | Deploy automático desde GitHub, muy rápido, CDN global | Solo frontend | ✅ Ilimitado |
| **Netlify** | Similar a Vercel, fácil de usar | Solo frontend | ✅ 100GB bandwidth/mes |
| **Cloudflare Pages** | CDN super rápido, sin límites | Solo frontend | ✅ Ilimitado |
| **GitHub Pages** | Gratis permanente | Solo sitios estáticos, sin variables de entorno | ✅ 1GB storage |

### Backend (Node.js + Express)

| Servicio | Pros | Contras | Plan Gratuito |
|----------|------|---------|---------------|
| **Render** ⭐ | Fácil, incluye DB PostgreSQL gratis | Duerme después de 15 min inactividad | ✅ 750h/mes |
| **Railway** | Muy bueno, PostgreSQL incluido | Solo $5 de crédito gratis/mes | ✅ $5 crédito/mes |
| **Fly.io** | Excelente performance, regiones globales | Requiere tarjeta pero no cobra | ✅ 3 VMs compartidas |
| **Cyclic** | Muy simple, buena integración | Límites bajos | ✅ Tier gratuito |

### Base de Datos

| Servicio | Tipo | Pros | Plan Gratuito |
|----------|------|------|---------------|
| **Turso** ⭐ | SQLite (edge) | Compatible con tu código actual, rápido | ✅ 9GB storage |
| **Neon** | PostgreSQL | Serverless, rápido | ✅ 3GB storage |
| **Supabase** | PostgreSQL | Incluye auth, storage | ✅ 500MB storage |
| **Railway** | PostgreSQL | Integrado con hosting | ✅ Incluido en plan |

---

## 🎯 Opción A: RECOMENDADA (Todo Gratis) {#opción-a-recomendada}

**Frontend:** Vercel  
**Backend:** Render  
**Base de Datos:** PostgreSQL de Render o Turso

### Paso 1: Preparar el Repositorio Git

```bash
# En la raíz de tu proyecto
cd "C:\Users\Gabriel Vieira\Downloads\comicsapp"

# Inicializar Git si no lo tienes
git init

# Agregar .gitignore GLOBAL en la raíz
echo "node_modules/
.env
.env.local
*.log
.DS_Store
database.db
service-account-key.json" > .gitignore

# Agregar todos los archivos
git add .
git commit -m "Preparar proyecto para deployment"
```

### Paso 2: Subir a GitHub

1. Crear un repositorio en [GitHub](https://github.com/new)
2. Nombre: `comiqueria-online`
3. Visibilidad: Private (si quieres que sea privado)
4. Ejecutar:

```bash
git remote add origin https://github.com/TU_USUARIO/comiqueria-online.git
git branch -M main
git push -u origin main
```

### Paso 3: Desplegar Backend en Render

1. Ve a [Render.com](https://render.com) y crea una cuenta
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name:** `comiqueria-backend`
   - **Environment:** `Node`
   - **Region:** `Oregon (US West)` o el más cercano
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

5. **Variables de Entorno** (Environment Variables):
   ```
   NODE_ENV=production
   JWT_SECRET=tu_clave_super_secreta_123456789
   PORT=3002
   GOOGLE_SHEETS_SPREADSHEET_ID=tu_id_si_lo_usas
   ```

6. Click en "Create Web Service"

7. **Importante:** Render te dará una URL como `https://comiqueria-backend.onrender.com`
   - ⚠️ Guarda esta URL, la necesitarás para el frontend

### Paso 4: Configurar Base de Datos en Render

1. En Render dashboard → "New +" → "PostgreSQL"
2. Configuración:
   - **Name:** `comiqueria-db`
   - **Database:** `comiqueria`
   - **User:** Se genera automáticamente
   - **Region:** La misma del backend
   - **Instance Type:** `Free`

3. Click "Create Database"

4. Copia la **Internal Database URL** que aparece

5. Ve al backend en Render → "Environment" → Agregar:
   ```
   DATABASE_URL=la_url_interna_copiada
   ```

### Paso 5: Migrar de SQLite a PostgreSQL

Necesitas adaptar tu código para usar PostgreSQL. Crea `backend/config/database-postgres.js`:

```javascript
const { Pool } = require('pg');

// Configuración del pool de PostgreSQL
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Funciones adaptadas
const getAll = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

const getOne = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

const runQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return {
      insertId: result.rows[0]?.id,
      changes: result.rowCount
    };
  } finally {
    client.release();
  }
};

module.exports = { getAll, getOne, runQuery, pool };
```

**Importante:** Tendrás que migrar tu esquema de SQLite a PostgreSQL y ajustar algunas queries.

### Paso 6: Desplegar Frontend en Vercel

1. Ve a [Vercel.com](https://vercel.com) y crea una cuenta
2. Click "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. Configuración:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Environment Variables:**
   ```
   VITE_API_URL=https://comiqueria-backend.onrender.com/api
   ```
   (Usa la URL de tu backend de Render)

6. Click "Deploy"

7. ¡Listo! Tu frontend estará en `https://tu-proyecto.vercel.app`

---

## 🎯 Opción B: Alternativa con Railway {#opción-b-alternativa}

Railway es más simple pero tiene límite de $5/mes gratuito.

### Paso 1: Preparar Repositorio Git (igual que Opción A)

### Paso 2: Desplegar en Railway (Backend + DB juntos)

1. Ve a [Railway.app](https://railway.app) y crea cuenta
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Railway detectará automáticamente Node.js
5. Agrega un servicio PostgreSQL:
   - "New" → "Database" → "Add PostgreSQL"
6. Variables de entorno se configuran automáticamente

### Paso 3: Frontend en Vercel (igual que Opción A)

---

## 💾 Configuración de Base de Datos {#base-de-datos}

### Opción 1: Mantener SQLite con Turso (Más fácil)

Turso es SQLite en la nube, compatible con tu código actual.

1. Instala Turso CLI:
```bash
npm install -g @tursodatabase/cli
```

2. Crea cuenta y database:
```bash
turso auth signup
turso db create comiqueria
turso db show comiqueria
```

3. Obtén la URL de conexión:
```bash
turso db show comiqueria --url
```

4. Actualiza `backend/config/database.js` para usar Turso:
```javascript
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./database.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});
```

### Opción 2: Migrar a PostgreSQL (Recomendado para producción)

**Ventajas:**
- Más robusto
- Mejor para múltiples usuarios concurrentes
- Gratis en Render/Railway

**Pasos:**
1. Instalar dependencia:
```bash
cd backend
npm install pg
```

2. Crear script de migración de SQLite a PostgreSQL
3. Actualizar `backend/config/database.js` como mostré arriba

---

## 🔐 Variables de Entorno {#variables-entorno}

### Backend (.env en producción)
```env
NODE_ENV=production
PORT=3002
JWT_SECRET=clave_super_segura_minimo_32_caracteres_aqui
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GOOGLE_SHEETS_SPREADSHEET_ID=opcional
```

### Frontend (.env.production)
```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## 🛠️ Mantenimiento Post-Deployment {#mantenimiento}

### Monitoreo

1. **Render:** Dashboard muestra logs en tiempo real
2. **Vercel:** Analytics gratuito incluido
3. **Uptime monitoring:** Usa [UptimeRobot](https://uptimerobot.com) (gratis)

### Actualizaciones

```bash
# Hacer cambios en local
git add .
git commit -m "Descripción del cambio"
git push

# Render y Vercel re-deployarán automáticamente
```

### Backup de Base de Datos

**PostgreSQL en Render:**
```bash
# Descargar backup
pg_dump $DATABASE_URL > backup.sql
```

**SQLite/Turso:**
```bash
turso db shell comiqueria ".backup backup.db"
```

---

## ✅ Checklist Final

Antes de deployment:
- [ ] `.gitignore` configurado correctamente
- [ ] Variables de entorno definidas
- [ ] `service-account-key.json` NO subido a Git
- [ ] `.env` NO subido a Git
- [ ] Scripts de build funcionando localmente
- [ ] CORS configurado para dominio de producción
- [ ] JWT_SECRET cambiado del valor de desarrollo

Post-deployment:
- [ ] Frontend carga correctamente
- [ ] Backend responde a peticiones
- [ ] Base de datos accesible
- [ ] Login funciona
- [ ] Google Sheets API funciona (si aplica)
- [ ] Probar todas las funcionalidades principales

---

## 🆘 Troubleshooting

### Error: Backend no responde
- Verifica que `PORT` use `process.env.PORT` en `server.js`
- Revisa los logs en el dashboard de Render

### Error: Frontend no conecta con Backend
- Verifica `VITE_API_URL` en Vercel
- Asegúrate que CORS permita el dominio de Vercel

### Error: Base de datos no conecta
- Verifica `DATABASE_URL` en variables de entorno
- Asegúrate de usar la URL "interna" en Render

---

## 💡 Recomendaciones Finales

1. **Empezar simple:** Usa Opción A (Vercel + Render)
2. **Base de datos:** Si tu app es pequeña, usa Turso. Si esperas mucho tráfico, PostgreSQL
3. **Monitoreo:** Configura alertas en UptimeRobot
4. **Dominio custom:** Vercel y Render permiten dominios custom gratis
5. **SSL:** Ambos incluyen HTTPS automáticamente

---

## 📚 Recursos Adicionales

- [Documentación Vercel](https://vercel.com/docs)
- [Documentación Render](https://render.com/docs)
- [Documentación Railway](https://docs.railway.app)
- [Turso Docs](https://docs.turso.tech)

---

**¿Necesitas ayuda?** Este proyecto tiene todo listo para deployment. Solo sigue los pasos y estarás online en menos de 1 hora. 🚀

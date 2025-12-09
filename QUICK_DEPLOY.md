# 🚀 Guía Rápida de Deployment - 30 Minutos

Esta es la versión EXPRESS para poner tu app en producción **AHORA MISMO**.

## ✅ Opción Más Rápida: Vercel + Render

### ⏱️ Tiempo total estimado: 30 minutos

---

## PASO 1: Preparar Git (5 minutos)

```bash
# Abre PowerShell en la carpeta de tu proyecto
cd "C:\Users\Gabriel Vieira\Downloads\comicsapp"

# Inicializar Git
git init

# Agregar todo
git add .

# Commit inicial
git commit -m "Preparar para deployment"
```

---

## PASO 2: Subir a GitHub (5 minutos)

1. Ve a https://github.com/new
2. Crea repositorio `comiqueria-online` (puede ser privado)
3. NO inicialices con README
4. Ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/comiqueria-online.git
git branch -M main
git push -u origin main
```

---

## PASO 3: Backend en Render (10 minutos)

1. **Crear cuenta:** https://render.com (usa GitHub para login)

2. **Crear PostgreSQL:**
   - Click "New +" → "PostgreSQL"
   - Name: `comiqueria-db`
   - Region: `Oregon (US West)`
   - Click "Create Database"
   - ESPERA a que termine (2-3 min)
   - COPIA la "Internal Database URL"

3. **Crear Web Service:**
   - Click "New +" → "Web Service"
   - Connect tu repositorio GitHub
   - Name: `comiqueria-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**

4. **Variables de Entorno:**
   Click "Advanced" → "Add Environment Variable":
   ```
   NODE_ENV=production
   JWT_SECRET=cambiar_por_algo_super_secreto_123456789
   DATABASE_URL=pegar_la_url_de_postgresql_aqui
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Espera 5-10 minutos
   - COPIA la URL (ej: `https://comiqueria-backend.onrender.com`)

---

## PASO 4: Frontend en Vercel (10 minutos)

1. **Crear cuenta:** https://vercel.com (usa GitHub para login)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Selecciona tu repositorio
   - Click "Import"

3. **Configurar:**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Variable de Entorno:**
   Click "Environment Variables" → Add:
   ```
   Name: VITE_API_URL
   Value: https://comiqueria-backend.onrender.com/api
   ```
   (Usa la URL de tu backend de Render)

5. **Deploy:**
   - Click "Deploy"
   - Espera 2-3 minutos
   - ¡LISTO! Tu app está en `https://tu-proyecto.vercel.app`

---

## ⚠️ IMPORTANTE: Migrar Base de Datos

Tu app usa SQLite, pero Render necesita PostgreSQL. Tienes 2 opciones:

### OPCIÓN A: Usar Turso (SQLite en la nube - FÁCIL)

```bash
# Instalar Turso CLI
npm install -g @tursodatabase/cli

# Crear cuenta y base de datos
turso auth signup
turso db create comiqueria

# Subir tu base de datos actual
turso db shell comiqueria < database.db

# Obtener credentials
turso db show comiqueria
```

Luego en Render, cambia `DATABASE_URL` por la URL de Turso.

**Ventaja:** No necesitas cambiar código, sigue usando SQLite.

### OPCIÓN B: Migrar a PostgreSQL (RECOMENDADO)

Necesitarás:
1. Instalar `pg`: `npm install pg --save`
2. Adaptar el código de `backend/config/database.js`
3. Migrar los datos manualmente

**Te puedo ayudar con esto si quieres.**

---

## 🎯 Verificación Post-Deployment

1. **Backend:** Visita `https://tu-backend.onrender.com/health`
   - Deberías ver: `{"status":"ok"}`

2. **Frontend:** Visita `https://tu-proyecto.vercel.app`
   - Deberías ver tu página cargada

3. **Login:** Intenta hacer login en `/admin`
   - Si funciona, ¡TODO OK! 🎉

---

## 🐛 Solución de Problemas

### Backend no responde
- Revisa logs en Render dashboard
- Verifica que `DATABASE_URL` esté configurada
- El primer deploy puede tardar hasta 10 minutos

### Frontend no conecta
- Verifica que `VITE_API_URL` apunte a tu backend
- Debe terminar en `/api`
- Ejemplo: `https://comiqueria-backend.onrender.com/api`

### Error 500 en el backend
- Probablemente sea la base de datos
- Si usas PostgreSQL, asegúrate que `DATABASE_URL` sea correcta
- Si usas Turso, asegúrate de instalar `@libsql/client`

---

## 📝 CHECKLIST

Antes de deployment:
- [ ] Código en GitHub
- [ ] `.gitignore` impide subir `.env` y `database.db`
- [ ] `service-account-key.json` NO está en Git

Backend (Render):
- [ ] PostgreSQL creado
- [ ] Web Service creado
- [ ] Variables de entorno configuradas
- [ ] Deploy completado exitosamente

Frontend (Vercel):
- [ ] Proyecto importado
- [ ] `VITE_API_URL` configurada
- [ ] Deploy completado

Testing:
- [ ] `/health` responde OK
- [ ] Frontend carga
- [ ] Puedes hacer login
- [ ] CRUD de comics funciona

---

## 💰 Costos

**TODO ES GRATIS:**
- ✅ Render: 750 horas/mes (suficiente)
- ✅ Vercel: Ilimitado
- ✅ PostgreSQL en Render: 1 GB gratis
- ✅ Turso: 9 GB gratis

**Limitaciones del plan gratuito:**
- Render: El backend se "duerme" después de 15 min sin usar
- Primera petición tras dormir: 30-60 segundos
- Para uso personal/demo está perfecto

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí, tu aplicación ya está EN LÍNEA y lista para usarse.

**Next steps:**
1. Compartir el link con amigos
2. Agregar un dominio custom (opcional)
3. Configurar Google Sheets API en producción
4. Agregar contenido (comics)

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en Render/Vercel dashboards
2. Verifica las variables de entorno
3. Consulta `DEPLOYMENT_GUIDE.md` para más detalles
4. Puedo ayudarte a debuggear cualquier problema

**Tu app está lista para el mundo real. ¡Éxito con tu comiquería online! 🚀📚**

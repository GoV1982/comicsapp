# 📚 Sistema de Gestión de Comiquería

Sistema completo de gestión para comiquería con panel administrativo y catálogo público.

## ✨ Características

### Panel Administrativo
- 👤 Gestión de usuarios y autenticación
- 📖 CRUD completo de comics
- 🏢 Gestión de editoriales
- 📦 Control de inventario y stock
- 💰 Sistema de ventas y contabilidad
- 👥 Gestión de clientes
- 📊 Dashboard con estadísticas
- 📄 Integración con Google Sheets
- 🔔 Sistema de notificaciones

### Catálogo Público
- 🛍️ Catálogo de comics disponibles
- 🔍 Búsqueda y filtros avanzados
- 🛒 Carrito de compras
- 👤 Registro y perfil de clientes
- ⭐ Sistema de reviews y calificaciones
- 💱 Selector de moneda (ARS/USD/EUR)
- 📱 Diseño responsive

## 🛠️ Tecnologías

**Backend:**
- Node.js + Express
- SQLite (desarrollo) / PostgreSQL (producción)
- JWT Authentication
- Google Sheets API

**Frontend:**
- React + Vite
- React Router
- Tailwind CSS
- Chart.js
- Axios

## 📁 Estructura del Proyecto

```
comicsapp/
├── backend/              # API REST
│   ├── config/          # Configuración de BD
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Autenticación, etc.
│   ├── routes/          # Rutas de API
│   ├── scripts/         # Scripts de utilidad
│   └── server.js        # Punto de entrada
│
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas/vistas
│   │   ├── services/    # API calls
│   │   └── contexts/    # Contextos de React
│   └── public/
│
└── docs/                # Documentación
```

## 🚀 Instalación Local

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
npm run dev
```

El backend estará en `http://localhost:3002`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con la URL del backend
npm run dev
```

El frontend estará en `http://localhost:5173`

### Credenciales por defecto
- **Usuario Admin:** `Admin`
- **Contraseña:** `admin123`

## 📖 Documentación de Deployment

### Inicio Rápido (30 minutos)
📘 **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Guía express para publicar en 30 minutos

### Guías Detalladas
- 📗 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guía completa de deployment
- 📙 **[HOSTING_COMPARISON.md](./HOSTING_COMPARISON.md)** - Comparativa de opciones
- 📕 **[DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)** - Migración de base de datos
- 📔 **[RENDER_CONFIG.md](./RENDER_CONFIG.md)** - Configuración específica de Render
- 📓 **[VERCEL_CONFIG.md](./VERCEL_CONFIG.md)** - Configuración específica de Vercel

### Verificación Pre-Deployment
```bash
node check-deployment.js
```

## 🌐 Deployment Recomendado (Gratis)

- **Frontend:** Vercel
- **Backend:** Render
- **Base de Datos:** PostgreSQL (Render) o Turso

Ver `QUICK_DEPLOY.md` para instrucciones paso a paso.

## 📚 API Endpoints

### Públicos
- `GET /api/public/catalogo` - Catálogo de comics
- `GET /api/public/comics/:id` - Detalle de comic
- `POST /api/auth-cliente/register` - Registro de cliente
- `POST /api/auth-cliente/login` - Login de cliente

### Admin (requieren autenticación)
- `GET /api/comics` - Lista de comics
- `POST /api/comics` - Crear comic
- `PUT /api/comics/:id` - Actualizar comic
- `DELETE /api/comics/:id` - Eliminar comic
- `GET /api/stock` - Consultar stock
- `POST /api/ventas` - Crear venta
- `GET /api/contabilidad/estadisticas` - Estadísticas

Ver documentación completa en `backend/routes/`

## 🔒 Seguridad

- ✅ JWT tokens para autenticación
- ✅ Bcrypt para hash de contraseñas
- ✅ CORS configurado
- ✅ Variables de entorno para secrets
- ✅ Validación de inputs

**Importante:** Cambia `JWT_SECRET` en producción.

## 📊 Base de Datos

### Desarrollo
SQLite (`database.db`)

### Producción
PostgreSQL o Turso (SQLite edge)

Ver `DATABASE_MIGRATION.md` para migración.

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Scripts Útiles

### Backend
```bash
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run check-db     # Verificar tabla usuarios
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linting
```

### Raíz
```bash
node check-deployment.js  # Verificar estado pre-deployment
```

## 🔧 Configuración

### Variables de Entorno - Backend

```env
NODE_ENV=development
PORT=3002
JWT_SECRET=tu_secret_key
DATABASE_URL=tu_database_url
GOOGLE_SHEETS_SPREADSHEET_ID=opcional
```

### Variables de Entorno - Frontend

```env
VITE_API_URL=http://localhost:3002/api
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## 👤 Autor

Gabriel Vieira

## 🆘 Soporte

¿Problemas con el deployment? 
1. Revisa `DEPLOYMENT_GUIDE.md`
2. Ejecuta `node check-deployment.js`
3. Chequea los logs en Render/Vercel

## 🎯 Roadmap

- [x] Panel administrativo completo
- [x] Catálogo público
- [x] Sistema de ventas
- [x] Integración Google Sheets
- [x] Sistema de reviews
- [x] Multi-moneda
- [ ] Pasarela de pago
- [ ] App móvil
- [ ] Sistema de envíos

## ⭐ Features Destacadas

- 🔄 Sincronización con Google Sheets
- 📱 100% Responsive
- ⚡ Performance optimizado
- 🎨 UI moderna con Tailwind
- 🔐 Autenticación segura
- 📊 Dashboard con estadísticas en tiempo real
- 🛒 Carrito persistente
- 💱 Conversión de monedas
- 📧 Sistema de notificaciones

---

**¿Listo para publicar?** → Ver `QUICK_DEPLOY.md` 🚀

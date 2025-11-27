// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { checkUsersTable } = require('./config/checkDatabase');

// Importar rutas
const authRoutes = require('./routes/auth');
const authClienteRoutes = require('./routes/authCliente');
const carritoRoutes = require('./routes/carrito');
const configuracionRoutes = require('./routes/configuracion');
const perfilRoutes = require('./routes/perfil');
const editorialesRoutes = require('./routes/editoriales');
const comicsRoutes = require('./routes/comics');
const stockRoutes = require('./routes/stock');
const publicRoutes = require('./routes/public');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const googleSheetsRoutes = require('./routes/googleSheets');
const notificacionesRoutes = require('./routes/notificaciones');

// Importar cron job de notificaciones
require('./cron/notificaciones');

const app = express();

// Middlewares - IMPORTANTE: orden correcto
app.use(express.json({ limit: '50mb' }));  // <- Debe ir ANTES de las rutas, aumentado límite para imports grandes
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de Sistema de Comiquería',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      public: '/api/public/*',
      auth: '/api/auth/*',
      admin: '/api/*'
    }
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas públicas (sin autenticación)
app.use('/api/public', publicRoutes);

// Rutas de autenticación y carrito (algunas públicas)
app.use('/api/auth', authRoutes);
app.use('/api/auth-cliente', authClienteRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/perfil', perfilRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/editoriales', editorialesRoutes);
app.use('/api/comics', comicsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/sheets', googleSheetsRoutes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Verificar base de datos antes de iniciar el servidor
const initializeDatabase = async () => {
  try {
    await checkUsersTable();
    // Aquí puedes agregar más verificaciones si es necesario
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

// Inicializar base de datos y arrancar servidor
async function startServer() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   SISTEMA DE GESTIÓN DE COMIQUERÍA        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('📊 Inicializando base de datos...');
    await initDatabase();

    const PORT = process.env.PORT || 3002;

    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════╗');
      console.log(`║   ✅ SERVIDOR ACTIVO                      ║`);
      console.log('╚════════════════════════════════════════════╝\n');
      console.log(`🌐 URL Local:     http://localhost:${PORT}`);
      console.log(`📝 Ambiente:      ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📚 Endpoints disponibles:');
      console.log(`   - Catálogo Público: http://localhost:${PORT}/api/public/catalogo`);
      console.log(`   - Login Admin:      http://localhost:${PORT}/api/auth/login`);
      console.log(`   - Health Check:     http://localhost:${PORT}/health`);
      console.log('\n⚠️  Presiona Ctrl+C para detener el servidor\n');
    });

  } catch (error) {
    console.error('\n❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor después de verificar la base de datos
initializeDatabase().then(() => {
  startServer();
});

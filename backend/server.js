// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const editorialesRoutes = require('./routes/editoriales');
const comicsRoutes = require('./routes/comics');
const stockRoutes = require('./routes/stock');
const publicRoutes = require('./routes/public');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/editoriales', editorialesRoutes);
app.use('/api/comics', comicsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Inicializar base de datos y arrancar servidor
async function startServer() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   SISTEMA DE GESTIÓN DE COMIQUERÍA        ║');
    console.log('╚════════════════════════════════════════════╝\n');
    
    console.log('📊 Inicializando base de datos...');
    await initDatabase();
    
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

// Iniciar servidor
startServer();
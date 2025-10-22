// generate-project.js - Generador Automático del Proyecto Completo
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  GENERADOR AUTOMÁTICO DE PROYECTO         ║');
console.log('║  Sistema de Gestión de Comiquería         ║');
console.log('╚════════════════════════════════════════════╝\n');

// Crear estructura de carpetas
const folders = [
  'backend',
  'backend/config',
  'backend/controllers',
  'backend/middleware',
  'backend/routes',
  'backend/utils',
  'backups'
];

console.log('📁 Creando estructura de carpetas...\n');
folders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✓ ${folder}`);
  }
});

// Contenido de los archivos
const files = {
  'backend/.env': `PORT=3001
NODE_ENV=development
JWT_SECRET=${require('crypto').randomBytes(64).toString('hex')}
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@comiqueria.com
BACKUP_TIME=03:00
GOOGLE_DRIVE_ENABLED=false`,

  'backend/package.json': JSON.stringify({
    name: "comiqueria-backend",
    version: "1.0.0",
    description: "Backend del sistema de gestión de comiquería",
    main: "server.js",
    scripts: {
      start: "node server.js",
      dev: "nodemon server.js",
      backup: "node utils/backup.js"
    },
    dependencies: {
      express: "^4.18.2",
      sqlite3: "^5.1.6",
      bcryptjs: "^2.4.3",
      jsonwebtoken: "^9.0.2",
      cors: "^2.8.5",
      dotenv: "^16.3.1",
      "node-cron": "^3.0.2"
    },
    devDependencies: {
      nodemon: "^3.0.1"
    }
  }, null, 2),

  'README.md': `# Sistema de Gestión de Comiquería

## 🚀 Inicio Rápido

1. Instalar dependencias:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Iniciar servidor:
\`\`\`bash
npm start
\`\`\`

3. Credenciales por defecto:
   - Usuario: Admin
   - Contraseña: admin123

## 📚 Documentación

El servidor estará en: http://localhost:3001

### Endpoints Públicos:
- GET /api/public/catalogo
- GET /api/public/editoriales
- GET /api/public/generos

### Endpoints Admin:
- POST /api/auth/login
- GET /api/editoriales
- POST /api/editoriales
- GET /api/comics
- POST /api/comics
- GET /api/stock

Ver guía completa en los artefactos de Claude.
`,

  '.gitignore': `node_modules/
backend/database.db
backend/.env
backups/
*.log
.DS_Store`
};

console.log('\n📄 Creando archivos de configuración...\n');
Object.entries(files).forEach(([filepath, content]) => {
  fs.writeFileSync(filepath, content);
  console.log(`✓ ${filepath}`);
});

console.log('\n⚠️  IMPORTANTE: Ahora debes copiar manualmente los siguientes archivos');
console.log('   desde los artefactos de Claude a sus ubicaciones:\n');

const filesToCopy = [
  'backend/server.js',
  'backend/config/database.js',
  'backend/middleware/auth.js',
  'backend/middleware/errorHandler.js',
  'backend/controllers/authController.js',
  'backend/controllers/editorialesController.js',
  'backend/controllers/comicsController.js',
  'backend/controllers/stockController.js',
  'backend/routes/auth.js',
  'backend/routes/editoriales.js',
  'backend/routes/comics.js',
  'backend/routes/stock.js',
  'backend/routes/public.js'
];

filesToCopy.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});

console.log('\n✅ Estructura base creada exitosamente!');
console.log('\n📝 Próximos pasos:');
console.log('   1. Copia los archivos listados arriba desde Claude');
console.log('   2. cd backend && npm install');
console.log('   3. npm start');
console.log('\n');
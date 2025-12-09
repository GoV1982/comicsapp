#!/usr/bin/env node

/**
 * Script de Pre-Deployment Checklist
 * Verifica que todo esté listo para producción
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICACIÓN PRE-DEPLOYMENT\n');
console.log('═'.repeat(50) + '\n');

let errors = 0;
let warnings = 0;
let passed = 0;

function check(name, condition, errorMsg, isWarning = false) {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        if (isWarning) {
            console.log(`⚠️  ${name}: ${errorMsg}`);
            warnings++;
        } else {
            console.log(`❌ ${name}: ${errorMsg}`);
            errors++;
        }
    }
}

// 1. Verificar archivos críticos
console.log('📁 Verificando archivos...\n');

check(
    'package.json (backend)',
    fs.existsSync(path.join(__dirname, 'backend', 'package.json')),
    'No se encuentra backend/package.json'
);

check(
    'package.json (frontend)',
    fs.existsSync(path.join(__dirname, 'frontend', 'package.json')),
    'No se encuentra frontend/package.json'
);

check(
    'server.js',
    fs.existsSync(path.join(__dirname, 'backend', 'server.js')),
    'No se encuentra backend/server.js'
);

check(
    '.gitignore',
    fs.existsSync(path.join(__dirname, '.gitignore')),
    'No se encuentra .gitignore en la raíz',
    true
);

// 2. Verificar que archivos sensibles NO estén trackeados
console.log('\n🔒 Verificando seguridad...\n');

const gitignoreContent = fs.existsSync(path.join(__dirname, '.gitignore'))
    ? fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8')
    : '';

check(
    '.env en .gitignore',
    gitignoreContent.includes('.env'),
    '.env debe estar en .gitignore'
);

check(
    'database.db en .gitignore',
    gitignoreContent.includes('database.db') || gitignoreContent.includes('*.db'),
    'database.db debe estar en .gitignore'
);

check(
    'service-account-key.json en .gitignore',
    gitignoreContent.includes('service-account-key.json'),
    'service-account-key.json debe estar en .gitignore'
);

// 3. Verificar configuración de producción
console.log('\n⚙️  Verificando configuración...\n');

check(
    '.env.production (backend)',
    fs.existsSync(path.join(__dirname, 'backend', '.env.production')),
    'Crear backend/.env.production con variables de producción',
    true
);

check(
    '.env.production (frontend)',
    fs.existsSync(path.join(__dirname, 'frontend', '.env.production')),
    'Crear frontend/.env.production con VITE_API_URL',
    true
);

// 4. Verificar scripts en package.json
console.log('\n📦 Verificando scripts...\n');

try {
    const backendPkg = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'backend', 'package.json'), 'utf8')
    );

    check(
        'script "start" en backend',
        backendPkg.scripts && backendPkg.scripts.start,
        'Agregar script "start" en backend/package.json'
    );

    const frontendPkg = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'frontend', 'package.json'), 'utf8')
    );

    check(
        'script "build" en frontend',
        frontendPkg.scripts && frontendPkg.scripts.build,
        'Agregar script "build" en frontend/package.json'
    );
} catch (err) {
    console.log(`❌ Error leyendo package.json: ${err.message}`);
    errors++;
}

// 5. Verificar dependencias críticas
console.log('\n📚 Verificando dependencias...\n');

try {
    const backendPkg = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'backend', 'package.json'), 'utf8')
    );

    check(
        'dotenv instalado',
        backendPkg.dependencies && backendPkg.dependencies.dotenv,
        'Instalar dotenv: npm install dotenv'
    );

    check(
        'express instalado',
        backendPkg.dependencies && backendPkg.dependencies.express,
        'Instalar express: npm install express'
    );

    check(
        'cors instalado',
        backendPkg.dependencies && backendPkg.dependencies.cors,
        'Instalar cors: npm install cors'
    );
} catch (err) {
    // Ya reportado antes
}

// 6. Resumen
console.log('\n' + '═'.repeat(50));
console.log('\n📊 RESUMEN:\n');
console.log(`✅ Tests pasados: ${passed}`);
console.log(`⚠️  Advertencias:  ${warnings}`);
console.log(`❌ Errores:       ${errors}`);

console.log('\n' + '═'.repeat(50) + '\n');

if (errors === 0 && warnings === 0) {
    console.log('🎉 ¡TODO LISTO PARA DEPLOYMENT!\n');
    console.log('Siguiente paso: Seguir QUICK_DEPLOY.md\n');
    process.exit(0);
} else if (errors === 0) {
    console.log('✅ Listo para deployment (con algunas advertencias)\n');
    console.log('Revisa las advertencias antes de continuar.\n');
    process.exit(0);
} else {
    console.log('❌ Debes corregir los errores antes de hacer deployment\n');
    process.exit(1);
}

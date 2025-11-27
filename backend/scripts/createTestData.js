const { runQuery } = require('../config/database');
const bcrypt = require('bcrypt');

async function createTestData() {
  try {
    console.log('🧪 Creando datos de prueba para sistema de notificaciones...');

    // 1. Crear editoriales de prueba
    console.log('📚 Creando editoriales...');
    const editoriales = [
      { nombre: 'Marvel Comics' },
      { nombre: 'DC Comics' },
      { nombre: 'Image Comics' },
      { nombre: 'Dark Horse' }
    ];

    const editorialIds = [];
    for (const editorial of editoriales) {
      const result = await runQuery('INSERT INTO editoriales (nombre) VALUES (?)', [editorial.nombre]);
      editorialIds.push(result.insertId);
      console.log(`✅ Editorial creada: ${editorial.nombre} (ID: ${result.insertId})`);
    }

    // 2. Crear cómics de prueba
    console.log('📖 Creando cómics...');
    const comics = [
      { titulo: 'Spider-Man: Blue', numero_edicion: '1', editorial_id: editorialIds[0], precio: 15.99, genero: 'Superhéroes', subgenero: 'Aventura' },
      { titulo: 'Batman: The Killing Joke', numero_edicion: '1', editorial_id: editorialIds[1], precio: 12.99, genero: 'Superhéroes', subgenero: 'Drama' },
      { titulo: 'The Walking Dead Vol. 1', numero_edicion: '1', editorial_id: editorialIds[2], precio: 9.99, genero: 'Terror', subgenero: 'Zombies' },
      { titulo: 'Hellboy: Seed of Destruction', numero_edicion: '1', editorial_id: editorialIds[3], precio: 14.99, genero: 'Fantasía', subgenero: 'Sobrenatural' },
      { titulo: 'X-Men: Dark Phoenix Saga', numero_edicion: '1', editorial_id: editorialIds[0], precio: 16.99, genero: 'Superhéroes', subgenero: 'Aventura' },
      { titulo: 'Wonder Woman: Year One', numero_edicion: '1', editorial_id: editorialIds[1], precio: 13.99, genero: 'Superhéroes', subgenero: 'Aventura' },
      { titulo: 'Invincible Vol. 1', numero_edicion: '1', editorial_id: editorialIds[2], precio: 11.99, genero: 'Superhéroes', subgenero: 'Aventura' },
      { titulo: 'Sin City: The Hard Goodbye', numero_edicion: '1', editorial_id: editorialIds[3], precio: 10.99, genero: 'Noir', subgenero: 'Crimen' },
      { titulo: 'Iron Man: Extremis', numero_edicion: '1', editorial_id: editorialIds[0], precio: 17.99, genero: 'Superhéroes', subgenero: 'Ciencia Ficción' },
      { titulo: 'Superman: Red Son', numero_edicion: '1', editorial_id: editorialIds[1], precio: 14.99, genero: 'Superhéroes', subgenero: 'Alternativo' }
    ];

    const comicIds = [];
    for (const comic of comics) {
      const result = await runQuery(`
        INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, subgenero, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'Disponible')
      `, [comic.titulo, comic.numero_edicion, comic.editorial_id, comic.precio, comic.genero, comic.subgenero]);
      comicIds.push(result.insertId);
      console.log(`✅ Cómic creado: ${comic.titulo} (ID: ${result.insertId})`);
    }

    // 3. Crear clientes de prueba
    console.log('👥 Creando clientes...');
    const clientes = [
      { nombre: 'Juan Pérez', email: 'juan@example.com', whatsapp: '3001234567' },
      { nombre: 'María García', email: 'maria@example.com', whatsapp: '3002345678' },
      { nombre: 'Carlos López', email: 'carlos@example.com', whatsapp: '3003456789' }
    ];

    const clienteIds = [];
    for (const cliente of clientes) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const result = await runQuery(`
        INSERT INTO clientes (nombre, email, password, whatsapp, email_verificado)
        VALUES (?, ?, ?, ?, 1)
      `, [cliente.nombre, cliente.email, hashedPassword, cliente.whatsapp]);
      clienteIds.push(result.insertId);
      console.log(`✅ Cliente creado: ${cliente.nombre} (ID: ${result.insertId})`);
    }

    // 4. Crear configuraciones de clientes con favoritos
    console.log('⚙️ Creando configuraciones de clientes...');
    const configuraciones = [
      { cliente_id: clienteIds[0], titulos_favoritos: [comicIds[0], comicIds[1]], notificaciones_similares: 1 }, // Juan: Spider-Man y Batman
      { cliente_id: clienteIds[1], titulos_favoritos: [comicIds[2], comicIds[3]], notificaciones_similares: 1 }, // María: Walking Dead y Hellboy
      { cliente_id: clienteIds[2], titulos_favoritos: [comicIds[4], comicIds[5]], notificaciones_similares: 0 }  // Carlos: X-Men y Wonder Woman (notificaciones desactivadas)
    ];

    for (const config of configuraciones) {
      await runQuery(`
        INSERT INTO configuracion_clientes (cliente_id, notificaciones, titulos_favoritos, notificaciones_similares)
        VALUES (?, 1, ?, ?)
      `, [config.cliente_id, JSON.stringify(config.titulos_favoritos), config.notificaciones_similares]);
      console.log(`✅ Configuración creada para cliente ID: ${config.cliente_id}`);
    }

    // 5. Crear algunos cómics "nuevos" (con fecha futura para simular nuevos lanzamientos)
    console.log('🆕 Creando cómics nuevos para testing...');
    const nuevosComics = [
      { titulo: 'Spider-Man: No Way Home', numero_edicion: '1', editorial_id: editorialIds[0], precio: 18.99, genero: 'Superhéroes', subgenero: 'Aventura', fecha: new Date(Date.now() + 86400000).toISOString() }, // Mañana
      { titulo: 'Batman: The Dark Knight Returns', numero_edicion: '1', editorial_id: editorialIds[1], precio: 19.99, genero: 'Superhéroes', subgenero: 'Drama', fecha: new Date(Date.now() + 172800000).toISOString() }, // Pasado mañana
      { titulo: 'The Walking Dead Vol. 2', numero_edicion: '2', editorial_id: editorialIds[2], precio: 10.99, genero: 'Terror', subgenero: 'Zombies', fecha: new Date(Date.now() + 259200000).toISOString() } // En 3 días
    ];

    for (const comic of nuevosComics) {
      await runQuery(`
        INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, subgenero, estado, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, 'Disponible', ?)
      `, [comic.titulo, comic.numero_edicion, comic.editorial_id, comic.precio, comic.genero, comic.subgenero, comic.fecha]);
      console.log(`✅ Cómic nuevo creado: ${comic.titulo}`);
    }

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Editoriales: ${editoriales.length}`);
    console.log(`   - Cómics: ${comics.length + nuevosComics.length}`);
    console.log(`   - Clientes: ${clientes.length}`);
    console.log('\n🔍 Usuarios de prueba:');
    clientes.forEach((cliente, index) => {
      console.log(`   - ${cliente.nombre}: ${cliente.email} / password123`);
      console.log(`     Favoritos: ${configuraciones[index].titulos_favoritos.length} cómics`);
    });

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
}

createTestData().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error en el script:', error);
  process.exit(1);
});

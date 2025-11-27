// backend/routes/public.js
const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../config/database');

// Obtener catálogo público (solo comics con stock)
router.get('/catalogo', async (req, res) => {
  try {
    const { search, genero, editorial_id, estado } = req.query;

    let query = `
      SELECT
        c.id,
        c.titulo,
        c.numero_edicion,
        c.precio,
        c.genero,
        c.subgenero,
        c.imagen_url,
        c.descripcion,
        c.estado,
        e.nombre as editorial_nombre,
        s.cantidad_disponible as _disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
    `;

    const params = [];

    // Filtro por estado
    if (estado) {
      query += ' WHERE c.estado = ?';
      params.push(estado);
    }

    // Filtro de búsqueda
    if (search) {
      query += estado ? ' AND' : ' WHERE';
      query += ' (c.titulo LIKE ? OR c.numero_edicion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro por género
    if (genero) {
      query += (estado || search) ? ' AND' : ' WHERE';
      query += ' c.genero = ?';
      params.push(genero);
    }

    // Filtro por editorial
    if (editorial_id) {
      query += (estado || search || genero) ? ' AND' : ' WHERE';
      query += ' c.editorial_id = ?';
      params.push(editorial_id);
    }

    query += ' ORDER BY c.fecha_creacion DESC';

    const comics = await getAll(query, params);

    res.json({
      success: true,
      data: comics,
      count: comics.length
    });

  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
});

// Obtener detalle de un comic (público)
router.get('/catalogo/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const comic = await getOne(
      `SELECT
        c.id,
        c.titulo,
        c.numero_edicion,
        c.precio,
        c.genero,
        c.subgenero,
        c.imagen_url,
        c.descripcion,
        c.estado,
        e.nombre as editorial_nombre,
        s.cantidad_disponible as _disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
      WHERE c.id = ?`,
      [id]
    );

    if (!comic) {
      return res.status(404).json({ 
        error: 'Comic no encontrado',
        message: 'El comic no existe o no está disponible'
      });
    }

    res.json({
      success: true,
      data: comic
    });

  } catch (error) {
    console.error('Error al obtener comic:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
});

// Obtener lista de editoriales (público)
router.get('/editoriales', async (req, res) => {
  try {
    const editoriales = await getAll(
      'SELECT id, nombre FROM editoriales ORDER BY nombre ASC'
    );

    res.json({
      success: true,
      data: editoriales
    });

  } catch (error) {
    console.error('Error al obtener editoriales:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
});

// Obtener lista de géneros disponibles (público)
router.get('/generos', async (req, res) => {
  try {
    const generos = await getAll(
      `SELECT DISTINCT c.genero
       FROM comics c
       LEFT JOIN stock s ON c.id = s.comic_id
       WHERE c.genero IS NOT NULL
       ORDER BY c.genero`
    );

    res.json({
      success: true,
      data: generos.map(g => g.genero)
    });

  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
});

// Proxy para imágenes externas (evita CORB)
router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL requerida' });
    }

    // Validar que sea una URL válida
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    const axios = require('axios');

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000, // 10 segundos timeout
      headers: {
        'User-Agent': 'ComicsApp-ImageProxy/1.0'
      }
    });

    // Copiar headers relevantes
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      'Access-Control-Allow-Origin': '*'
    });

    response.data.pipe(res);

  } catch (error) {
    console.error('Error en proxy de imagen:', error.message);
    res.status(500).json({
      error: 'Error al cargar imagen',
      message: error.message
    });
  }
});

// Nuevo endpoint de bienvenida con logging
router.get('/welcome', (req, res) => {
  // Log request metadata
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Return JSON response
  res.json({
    message: 'Welcome to the Comics API!'
  });
});

// Nuevo endpoint para verificar imágenes de comics
router.get('/image-checker', async (req, res) => {
  try {
    const comics = await getAll(`
      SELECT
        c.id,
        c.titulo,
        c.numero_edicion,
        c.imagen_url,
        e.nombre as editorial_nombre
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      WHERE c.imagen_url IS NOT NULL AND c.imagen_url != ''
      ORDER BY c.id ASC
    `);

    res.json({
      success: true,
      data: comics,
      count: comics.length
    });

  } catch (error) {
    console.error('Error al obtener comics para verificación de imágenes:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
});

module.exports = router;

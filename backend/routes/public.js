// backend/routes/public.js
const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../config/database');

// Obtener catálogo público (solo comics con stock)
router.get('/catalogo', async (req, res) => {
  try {
    const { search, genero, editorial_id } = req.query;
    
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
        e.nombre as editorial_nombre,
        s.cantidad_disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
      WHERE s.cantidad_disponible > 0
    `;
    
    const params = [];

    // Filtro de búsqueda
    if (search) {
      query += ' AND (c.titulo LIKE ? OR c.numero_edicion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro por género
    if (genero) {
      query += ' AND c.genero = ?';
      params.push(genero);
    }

    // Filtro por editorial
    if (editorial_id) {
      query += ' AND c.editorial_id = ?';
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
        e.nombre as editorial_nombre,
        s.cantidad_disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
      WHERE c.id = ? AND s.cantidad_disponible > 0`,
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
       INNER JOIN stock s ON c.id = s.comic_id
       WHERE s.cantidad_disponible > 0 AND c.genero IS NOT NULL
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

module.exports = router;
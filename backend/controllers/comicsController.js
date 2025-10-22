// backend/controllers/comicsController.js
const { getAll, getOne, runQuery } = require('../config/database');

// Obtener todos los comics (con información de editorial y stock)
const getAllComics = async (req, res) => {
  try {
    const { search, genero, editorial_id } = req.query;
    
    let query = `
      SELECT 
        c.*,
        e.nombre as editorial_nombre,
        s.cantidad_disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
      WHERE 1=1
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
    console.error('Error al obtener comics:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Obtener un comic por ID
const getComicById = async (req, res) => {
  try {
    const { id } = req.params;

    const comic = await getOne(
      `SELECT 
        c.*,
        e.nombre as editorial_nombre,
        s.cantidad_disponible
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      LEFT JOIN stock s ON c.id = s.comic_id
      WHERE c.id = ?`,
      [id]
    );

    if (!comic) {
      return res.status(404).json({ 
        error: 'Comic no encontrado',
        message: `No existe un comic con ID ${id}`
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
};

// Crear nuevo comic
const createComic = async (req, res) => {
  try {
    const { 
      titulo, 
      numero_edicion, 
      editorial_id, 
      precio, 
      genero, 
      subgenero, 
      imagen_url,
      descripcion 
    } = req.body;

    // Validar campos obligatorios
    if (!titulo || !numero_edicion || !editorial_id || !precio || !genero) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Título, número de edición, editorial, precio y género son requeridos'
      });
    }

    // Verificar que la editorial existe
    const editorial = await getOne(
      'SELECT id FROM editoriales WHERE id = ?',
      [editorial_id]
    );

    if (!editorial) {
      return res.status(400).json({ 
        error: 'Editorial inválida',
        message: 'La editorial seleccionada no existe'
      });
    }

    // Validar precio
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({ 
        error: 'Precio inválido',
        message: 'El precio debe ser un número válido mayor o igual a cero'
      });
    }

    // Crear comic
    const result = await runQuery(
      `INSERT INTO comics 
      (titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, numero_edicion, editorial_id, precio, genero, subgenero || null, imagen_url || null, descripcion || null]
    );

    // El trigger creará automáticamente el registro de stock con cantidad 0

    res.status(201).json({
      success: true,
      message: 'Comic creado correctamente',
      data: {
        id: result.id,
        titulo,
        numero_edicion,
        editorial_id,
        precio,
        genero,
        subgenero,
        imagen_url,
        descripcion
      }
    });

  } catch (error) {
    console.error('Error al crear comic:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Actualizar comic
const updateComic = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      numero_edicion, 
      editorial_id, 
      precio, 
      genero, 
      subgenero, 
      imagen_url,
      descripcion 
    } = req.body;

    // Verificar que el comic existe
    const comic = await getOne(
      'SELECT id FROM comics WHERE id = ?',
      [id]
    );

    if (!comic) {
      return res.status(404).json({ 
        error: 'Comic no encontrado',
        message: `No existe un comic con ID ${id}`
      });
    }

    // Validar campos obligatorios
    if (!titulo || !numero_edicion || !editorial_id || !precio || !genero) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Título, número de edición, editorial, precio y género son requeridos'
      });
    }

    // Verificar que la editorial existe
    const editorial = await getOne(
      'SELECT id FROM editoriales WHERE id = ?',
      [editorial_id]
    );

    if (!editorial) {
      return res.status(400).json({ 
        error: 'Editorial inválida',
        message: 'La editorial seleccionada no existe'
      });
    }

    // Validar precio
    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({ 
        error: 'Precio inválido',
        message: 'El precio debe ser un número válido mayor o igual a cero'
      });
    }

    // Actualizar comic
    await runQuery(
      `UPDATE comics 
      SET titulo = ?, numero_edicion = ?, editorial_id = ?, precio = ?, 
          genero = ?, subgenero = ?, imagen_url = ?, descripcion = ?
      WHERE id = ?`,
      [titulo, numero_edicion, editorial_id, precio, genero, subgenero || null, imagen_url || null, descripcion || null, id]
    );

    res.json({
      success: true,
      message: 'Comic actualizado correctamente',
      data: {
        id: parseInt(id),
        titulo,
        numero_edicion,
        editorial_id,
        precio,
        genero,
        subgenero,
        imagen_url,
        descripcion
      }
    });

  } catch (error) {
    console.error('Error al actualizar comic:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Eliminar comic
const deleteComic = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const comic = await getOne(
      'SELECT * FROM comics WHERE id = ?',
      [id]
    );

    if (!comic) {
      return res.status(404).json({ 
        error: 'Comic no encontrado',
        message: `No existe un comic con ID ${id}`
      });
    }

    // Verificar si tiene ventas asociadas
    const ventasCount = await getOne(
      'SELECT COUNT(*) as count FROM ventas_detalle WHERE comic_id = ?',
      [id]
    );

    if (ventasCount.count > 0) {
      return res.status(400).json({ 
        error: 'Comic con ventas asociadas',
        message: `No se puede eliminar "${comic.titulo}" porque tiene ${ventasCount.count} venta(s) registrada(s). Considera dejarlo sin stock en su lugar.`,
        ventasCount: ventasCount.count
      });
    }

    // Verificar si tiene reservas activas
    const reservasCount = await getOne(
      `SELECT COUNT(*) as count FROM reservas 
       WHERE comic_id = ? AND estado IN ('pendiente', 'confirmada')`,
      [id]
    );

    if (reservasCount.count > 0) {
      return res.status(400).json({ 
        error: 'Comic con reservas activas',
        message: `No se puede eliminar "${comic.titulo}" porque tiene ${reservasCount.count} reserva(s) activa(s)`,
        reservasCount: reservasCount.count
      });
    }

    // Eliminar comic (el trigger eliminará el stock automáticamente por CASCADE)
    await runQuery(
      'DELETE FROM comics WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Comic eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar comic:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Obtener géneros únicos
const getGeneros = async (req, res) => {
  try {
    const generos = await getAll(
      'SELECT DISTINCT genero FROM comics WHERE genero IS NOT NULL ORDER BY genero'
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
};

module.exports = {
  getAllComics,
  getComicById,
  createComic,
  updateComic,
  deleteComic,
  getGeneros
};
// backend/controllers/stockController.js
const { getAll, getOne, runQuery } = require('../config/database');

// Obtener todo el stock con información de comics
const getAllStock = async (req, res) => {
  try {
    const {
      bajo_stock,
      sin_stock,
      search,
      filterStock,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT
        s.*,
        c.titulo,
        c.numero_edicion,
        c.precio,
        e.nombre as editorial_nombre
      FROM stock s
      INNER JOIN comics c ON s.comic_id = c.id
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      WHERE 1=1
    `;

    const params = [];

    // Filtro de búsqueda (título o editorial)
    if (search && search.trim()) {
      query += ' AND (c.titulo LIKE ? OR e.nombre LIKE ?)';
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam);
    }

    // Filtro por estado de stock
    if (filterStock) {
      switch (filterStock) {
        case 'sin_stock':
          query += ' AND s.cantidad_disponible = 0';
          break;
        case 'bajo_stock':
          query += ' AND s.cantidad_disponible > 0 AND s.cantidad_disponible < 5';
          break;
        case 'disponible':
          query += ' AND s.cantidad_disponible >= 5';
          break;
        // 'all' no agrega filtro adicional
      }
    } else {
      // Mantener compatibilidad con filtros antiguos
      if (bajo_stock === 'true') {
        query += ' AND s.cantidad_disponible > 0 AND s.cantidad_disponible < 5';
      }
      if (sin_stock === 'true') {
        query += ' AND s.cantidad_disponible = 0';
      }
    }

    // Obtener total de registros para paginación
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await getOne(countQuery, params);
    const totalRecords = countResult.total;

    // Agregar ordenamiento y paginación
    query += ' ORDER BY s.cantidad_disponible ASC, c.titulo ASC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const stock = await getAll(query, params);

    res.json({
      success: true,
      data: stock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit))
      },
      count: stock.length
    });

  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener stock de un comic específico
const getStockByComicId = async (req, res) => {
  try {
    const { comic_id } = req.params;

    const stock = await getOne(
      `SELECT 
        s.*,
        c.titulo,
        c.numero_edicion,
        c.precio,
        e.nombre as editorial_nombre
      FROM stock s
      INNER JOIN comics c ON s.comic_id = c.id
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      WHERE s.comic_id = ?`,
      [comic_id]
    );

    if (!stock) {
      return res.status(404).json({
        error: 'Stock no encontrado',
        message: `No existe stock para el comic con ID ${comic_id}`
      });
    }

    res.json({
      success: true,
      data: stock
    });

  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Actualizar cantidad de stock
const updateStock = async (req, res) => {
  try {
    const { stock_id } = req.params;
    const { cantidad_disponible } = req.body;

    // Validar cantidad
    if (cantidad_disponible === undefined || cantidad_disponible === null) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'La cantidad disponible es requerida'
      });
    }

    if (isNaN(cantidad_disponible) || cantidad_disponible < 0) {
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'La cantidad debe ser un número válido mayor o igual a cero'
      });
    }

    // Verificar que el stock existe
    const stock = await getOne(
      'SELECT id, comic_id FROM stock WHERE id = ?',
      [stock_id]
    );

    if (!stock) {
      return res.status(404).json({
        error: 'Stock no encontrado',
        message: `No existe stock con ID ${stock_id}`
      });
    }

    // Actualizar stock
    await runQuery(
      'UPDATE stock SET cantidad_disponible = ? WHERE id = ?',
      [cantidad_disponible, stock_id]
    );

    res.json({
      success: true,
      message: 'Stock actualizado correctamente',
      data: {
        stock_id: parseInt(stock_id),
        comic_id: stock.comic_id,
        cantidad_disponible: parseInt(cantidad_disponible)
      }
    });

  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Ajustar stock (incrementar o decrementar)
const adjustStock = async (req, res) => {
  try {
    const { stock_id } = req.params;
    const { ajuste, motivo } = req.body;

    // Validar ajuste
    if (ajuste === undefined || ajuste === null || ajuste === 0) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El ajuste es requerido y debe ser diferente de cero'
      });
    }

    if (isNaN(ajuste)) {
      return res.status(400).json({
        error: 'Ajuste inválido',
        message: 'El ajuste debe ser un número válido'
      });
    }

    // Obtener stock actual
    const stock = await getOne(
      `SELECT s.*, c.titulo
       FROM stock s
       INNER JOIN comics c ON s.comic_id = c.id
       WHERE s.id = ?`,
      [stock_id]
    );

    if (!stock) {
      return res.status(404).json({
        error: 'Stock no encontrado',
        message: `No existe stock con ID ${stock_id}`
      });
    }

    const nuevaCantidad = stock.cantidad_disponible + ajuste;

    // Validar que no quede negativo
    if (nuevaCantidad < 0) {
      return res.status(400).json({
        error: 'Stock insuficiente',
        message: `No se puede reducir el stock. Stock actual: ${stock.cantidad_disponible}, ajuste solicitado: ${ajuste}`
      });
    }

    // Actualizar stock
    await runQuery(
      'UPDATE stock SET cantidad_disponible = ? WHERE id = ?',
      [nuevaCantidad, stock_id]
    );

    res.json({
      success: true,
      message: 'Stock ajustado correctamente',
      data: {
        stock_id: parseInt(stock_id),
        comic_id: stock.comic_id,
        comic_titulo: stock.titulo,
        cantidad_anterior: stock.cantidad_disponible,
        ajuste: ajuste,
        cantidad_nueva: nuevaCantidad,
        motivo: motivo || 'Sin motivo especificado'
      }
    });

  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener resumen de stock (estadísticas)
const getStockSummary = async (req, res) => {
  try {
    const summary = await getOne(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(cantidad_disponible), 0) as total_unidades,
        SUM(CASE WHEN cantidad_disponible = 0 THEN 1 ELSE 0 END) as sin_stock,
        SUM(CASE WHEN cantidad_disponible > 0 AND cantidad_disponible < 5 THEN 1 ELSE 0 END) as bajo_stock
      FROM stock
    `);

    // Asegurar que los valores sean números válidos
    const data = {
      total_items: parseInt(summary?.total_items) || 0,
      total_unidades: parseInt(summary?.total_unidades) || 0,
      sin_stock: parseInt(summary?.sin_stock) || 0,
      bajo_stock: parseInt(summary?.bajo_stock) || 0
    };

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error al obtener resumen de stock:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener lista de comics
const getComics = async (req, res) => {
  try {
    // obtener lista de comics desde la BD
    const comics = await getAll('SELECT * FROM comics', []);
    res.json({
      success: true,
      data: comics,
      count: comics.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comics' });
  }
};

// Crear un nuevo comic
const createComic = async (req, res) => {
  try {
    const { titulo, autor, precio } = req.body;

    // Validar datos
    if (!titulo || !autor || precio === undefined) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Título, autor y precio son requeridos'
      });
    }

    if (isNaN(precio) || precio < 0) {
      return res.status(400).json({
        error: 'Precio inválido',
        message: 'El precio debe ser un número válido mayor o igual a cero'
      });
    }

    // Crear comic en la BD
    const result = await runQuery(
      'INSERT INTO comics (titulo, autor, precio) VALUES (?, ?, ?)',
      [titulo, autor, precio]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Comic creado correctamente'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear comic' });
  }
};

module.exports = {
  getAllStock,
  getStockByComicId,
  updateStock,
  adjustStock,
  getStockSummary,
  getComics,
  createComic
};
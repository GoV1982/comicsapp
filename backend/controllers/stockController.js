// backend/controllers/stockController.js
const { getAll, getOne, runQuery } = require('../config/database');

// Obtener todo el stock con información de comics
const getAllStock = async (req, res) => {
  try {
    const { bajo_stock, sin_stock } = req.query;
    
    let query = `
      SELECT 
        s.*,
        c.titulo,
        c.numero_edicion,
        c.precio,
        c.imagen_url,
        e.nombre as editorial_nombre
      FROM stock s
      INNER JOIN comics c ON s.comic_id = c.id
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      WHERE 1=1
    `;
    
    const params = [];

    // Filtro de bajo stock (menos de 5 unidades)
    if (bajo_stock === 'true') {
      query += ' AND s.cantidad_disponible > 0 AND s.cantidad_disponible < 5';
    }

    // Filtro sin stock
    if (sin_stock === 'true') {
      query += ' AND s.cantidad_disponible = 0';
    }

    query += ' ORDER BY s.cantidad_disponible ASC, c.titulo ASC';

    const stock = await getAll(query, params);

    res.json({
      success: true,
      data: stock,
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
    const { comic_id } = req.params;
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

    // Verificar que el comic existe
    const comic = await getOne(
      'SELECT id, titulo FROM comics WHERE id = ?',
      [comic_id]
    );

    if (!comic) {
      return res.status(404).json({ 
        error: 'Comic no encontrado',
        message: `No existe un comic con ID ${comic_id}`
      });
    }

    // Verificar si ya existe stock para este comic
    const stockExists = await getOne(
      'SELECT id FROM stock WHERE comic_id = ?',
      [comic_id]
    );

    if (stockExists) {
      // Actualizar stock existente
      await runQuery(
        'UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?',
        [cantidad_disponible, comic_id]
      );
    } else {
      // Crear nuevo registro de stock (por si acaso no se creó con el trigger)
      await runQuery(
        'INSERT INTO stock (comic_id, cantidad_disponible) VALUES (?, ?)',
        [comic_id, cantidad_disponible]
      );
    }

    res.json({
      success: true,
      message: 'Stock actualizado correctamente',
      data: {
        comic_id: parseInt(comic_id),
        comic_titulo: comic.titulo,
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
    const { comic_id } = req.params;
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
       WHERE s.comic_id = ?`,
      [comic_id]
    );

    if (!stock) {
      return res.status(404).json({ 
        error: 'Stock no encontrado',
        message: `No existe stock para el comic con ID ${comic_id}`
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
      'UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?',
      [nuevaCantidad, comic_id]
    );

    res.json({
      success: true,
      message: 'Stock ajustado correctamente',
      data: {
        comic_id: parseInt(comic_id),
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
        SUM(cantidad_disponible) as total_unidades,
        SUM(CASE WHEN cantidad_disponible = 0 THEN 1 ELSE 0 END) as sin_stock,
        SUM(CASE WHEN cantidad_disponible > 0 AND cantidad_disponible < 5 THEN 1 ELSE 0 END) as bajo_stock
      FROM stock
    `);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error al obtener resumen de stock:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

module.exports = {
  getAllStock,
  getStockByComicId,
  updateStock,
  adjustStock,
  getStockSummary
};
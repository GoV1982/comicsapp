// backend/controllers/configuracionController.js
const { runQuery, getOne, getAll } = require('../config/database');
const db = require('../config/database').db;

// Obtener configuración del cliente
const getConfiguracion = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    let configuracion = await getOne('SELECT * FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);

    // Si no existe configuración, crear una por defecto
    if (!configuracion) {
      await runQuery(
        'INSERT INTO configuracion_clientes (cliente_id, notificaciones, titulos_favoritos) VALUES (?, 1, ?)',
        [clienteId, JSON.stringify([])]
      );
      configuracion = await getOne('SELECT * FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);
    }

    // Parsear titulos_favoritos si existe
    if (configuracion.titulos_favoritos) {
      try {
        configuracion.titulos_favoritos = JSON.parse(configuracion.titulos_favoritos);
      } catch (error) {
        console.error('Error al parsear titulos_favoritos:', error);
        configuracion.titulos_favoritos = [];
      }
    } else {
      configuracion.titulos_favoritos = [];
    }

    res.json({
      success: true,
      data: configuracion
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Actualizar configuración del cliente
const updateConfiguracion = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { notificaciones, titulos_favoritos, notificaciones_similares } = req.body;

    // Validar datos
    const updates = {};
    if (typeof notificaciones === 'boolean') {
      updates.notificaciones = notificaciones ? 1 : 0;
    }

    if (typeof notificaciones_similares === 'boolean') {
      updates.notificaciones_similares = notificaciones_similares ? 1 : 0;
    }

    if (Array.isArray(titulos_favoritos)) {
      // Validar que todos los IDs sean números
      const validIds = titulos_favoritos.filter(id => typeof id === 'number' && id > 0);
      updates.titulos_favoritos = JSON.stringify(validIds);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'No se proporcionaron datos válidos para actualizar'
      });
    }

    // Verificar si existe configuración
    let configuracion = await getOne('SELECT id FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);

    if (configuracion) {
      // Actualizar
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(clienteId);

      await runQuery(
        `UPDATE configuracion_clientes SET ${setClause}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE cliente_id = ?`,
        values
      );
    } else {
      // Crear
      updates.cliente_id = clienteId;
      const columns = Object.keys(updates).join(', ');
      const placeholders = Object.keys(updates).map(() => '?').join(', ');
      const values = Object.values(updates);

      await runQuery(
        `INSERT INTO configuracion_clientes (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Agregar título favorito
const addTituloFavorito = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { comic_id } = req.body;

    if (!comic_id || typeof comic_id !== 'number') {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere un ID de cómic válido'
      });
    }

    // Verificar que el cómic existe
    const comic = await getOne('SELECT id, titulo FROM comics WHERE id = ?', [comic_id]);
    if (!comic) {
      return res.status(404).json({
        error: 'Cómic no encontrado',
        message: 'El cómic especificado no existe'
      });
    }

    // Obtener configuración actual
    let configuracion = await getOne('SELECT titulos_favoritos FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);

    let favoritos = [];
    if (configuracion && configuracion.titulos_favoritos) {
      try {
        favoritos = JSON.parse(configuracion.titulos_favoritos);
      } catch (error) {
        console.error('Error al parsear titulos_favoritos:', error);
        favoritos = [];
      }
    }

    // Verificar si ya está en favoritos
    if (favoritos.includes(comic_id)) {
      return res.status(400).json({
        error: 'Ya es favorito',
        message: `"${comic.titulo}" ya está en tus favoritos`
      });
    }

    // Agregar a favoritos
    favoritos.push(comic_id);

    // Actualizar configuración
    const titulosFavoritosStr = JSON.stringify(favoritos);

    if (configuracion) {
      await runQuery(
        'UPDATE configuracion_clientes SET titulos_favoritos = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE cliente_id = ?',
        [titulosFavoritosStr, clienteId]
      );
    } else {
      await runQuery(
        'INSERT INTO configuracion_clientes (cliente_id, titulos_favoritos) VALUES (?, ?)',
        [clienteId, titulosFavoritosStr]
      );
    }

    res.json({
      success: true,
      message: `"${comic.titulo}" agregado a favoritos`
    });

  } catch (error) {
    console.error('Error al agregar favorito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Eliminar título favorito
const removeTituloFavorito = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { comicId } = req.params;

    const comic_id = parseInt(comicId);
    if (!comic_id || isNaN(comic_id)) {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'Se requiere un ID de cómic válido'
      });
    }

    // Obtener configuración actual
    const configuracion = await getOne('SELECT titulos_favoritos FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);

    if (!configuracion || !configuracion.titulos_favoritos) {
      return res.status(404).json({
        error: 'Configuración no encontrada',
        message: 'No tienes configuración de favoritos'
      });
    }

    let favoritos = [];
    try {
      favoritos = JSON.parse(configuracion.titulos_favoritos);
    } catch (error) {
      console.error('Error al parsear titulos_favoritos:', error);
      return res.status(500).json({
        error: 'Error en configuración',
        message: 'Error al procesar tus favoritos'
      });
    }

    // Verificar si está en favoritos
    const index = favoritos.indexOf(comic_id);
    if (index === -1) {
      return res.status(404).json({
        error: 'No es favorito',
        message: 'Este cómic no está en tus favoritos'
      });
    }

    // Remover de favoritos
    favoritos.splice(index, 1);

    // Actualizar configuración
    const titulosFavoritosStr = JSON.stringify(favoritos);
    await runQuery(
      'UPDATE configuracion_clientes SET titulos_favoritos = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE cliente_id = ?',
      [titulosFavoritosStr, clienteId]
    );

    res.json({
      success: true,
      message: 'Cómic removido de favoritos'
    });

  } catch (error) {
    console.error('Error al remover favorito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener títulos favoritos con detalles
const getTitulosFavoritos = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    // Obtener configuración
    const configuracion = await getOne('SELECT titulos_favoritos FROM configuracion_clientes WHERE cliente_id = ?', [clienteId]);

    if (!configuracion || !configuracion.titulos_favoritos) {
      return res.json({
        success: true,
        data: []
      });
    }

    let favoritos = [];
    try {
      favoritos = JSON.parse(configuracion.titulos_favoritos);
    } catch (error) {
      console.error('Error al parsear titulos_favoritos:', error);
      return res.json({
        success: true,
        data: []
      });
    }

    if (favoritos.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Obtener detalles de los cómics favoritos
    const comics = await getAll(`
      SELECT
        c.id,
        c.titulo,
        c.numero_edicion,
        c.precio,
        c.genero,
        c.imagen_url,
        e.nombre as editorial_nombre
      FROM comics c
      JOIN editoriales e ON c.editorial_id = e.id
      WHERE c.id IN (${favoritos.map(() => '?').join(',')})
      ORDER BY c.titulo ASC
    `, favoritos);

    res.json({
      success: true,
      data: comics
    });

  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

module.exports = {
  getConfiguracion,
  updateConfiguracion,
  addTituloFavorito,
  removeTituloFavorito,
  getTitulosFavoritos
};

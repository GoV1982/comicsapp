// backend/controllers/editorialesController.js
const { getAll, getOne, runQuery } = require('../config/database');

// Obtener todas las editoriales
const getAllEditoriales = async (req, res) => {
  try {
    const editoriales = await getAll(
      'SELECT * FROM editoriales ORDER BY nombre ASC'
    );

    res.json({
      success: true,
      data: editoriales,
      count: editoriales.length
    });

  } catch (error) {
    console.error('Error al obtener editoriales:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener una editorial por ID
const getEditorialById = async (req, res) => {
  try {
    const { id } = req.params;

    const editorial = await getOne(
      'SELECT * FROM editoriales WHERE id = ?',
      [id]
    );

    if (!editorial) {
      return res.status(404).json({
        error: 'Editorial no encontrada',
        message: `No existe una editorial con ID ${id}`
      });
    }

    res.json({
      success: true,
      data: editorial
    });

  } catch (error) {
    console.error('Error al obtener editorial:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Crear nueva editorial
const createEditorial = async (req, res) => {
  try {
    const { nombre, margen_ganancia, email_contacto, whatsapp_contacto } = req.body;

    // Validar datos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre de la editorial es requerido'
      });
    }

    // Verificar si ya existe
    const exists = await getOne(
      'SELECT id FROM editoriales WHERE nombre = ?',
      [nombre.trim()]
    );

    if (exists) {
      return res.status(400).json({
        error: 'Editorial duplicada',
        message: 'Ya existe una editorial con ese nombre'
      });
    }

    // Crear editorial
    const result = await runQuery(
      'INSERT INTO editoriales (nombre, margen_ganancia, email_contacto, whatsapp_contacto) VALUES (?, ?, ?, ?)',
      [nombre.trim(), margen_ganancia || 0, email_contacto || null, whatsapp_contacto || null]
    );

    res.status(201).json({
      success: true,
      message: 'Editorial creada correctamente',
      data: {
        id: result.id,
        nombre: nombre.trim(),
        margen_ganancia: margen_ganancia || 0,
        email_contacto: email_contacto || null,
        whatsapp_contacto: whatsapp_contacto || null
      }
    });

  } catch (error) {
    console.error('Error al crear editorial:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Actualizar editorial
const updateEditorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, margen_ganancia, email_contacto, whatsapp_contacto } = req.body;

    // Validar datos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre de la editorial es requerido'
      });
    }

    // Verificar que existe
    const editorial = await getOne(
      'SELECT id FROM editoriales WHERE id = ?',
      [id]
    );

    if (!editorial) {
      return res.status(404).json({
        error: 'Editorial no encontrada',
        message: `No existe una editorial con ID ${id}`
      });
    }

    // Verificar si el nuevo nombre ya existe (en otra editorial)
    const duplicate = await getOne(
      'SELECT id FROM editoriales WHERE nombre = ? AND id != ?',
      [nombre.trim(), id]
    );

    if (duplicate) {
      return res.status(400).json({
        error: 'Nombre duplicado',
        message: 'Ya existe otra editorial con ese nombre'
      });
    }

    // Actualizar editorial
    await runQuery(
      'UPDATE editoriales SET nombre = ?, margen_ganancia = ?, email_contacto = ?, whatsapp_contacto = ? WHERE id = ?',
      [nombre.trim(), margen_ganancia || 0, email_contacto || null, whatsapp_contacto || null, id]
    );

    res.json({
      success: true,
      message: 'Editorial actualizada correctamente',
      data: {
        id: parseInt(id),
        nombre: nombre.trim(),
        margen_ganancia: margen_ganancia || 0,
        email_contacto: email_contacto || null,
        whatsapp_contacto: whatsapp_contacto || null
      }
    });

  } catch (error) {
    console.error('Error al actualizar editorial:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Eliminar editorial
const deleteEditorial = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const editorial = await getOne(
      'SELECT * FROM editoriales WHERE id = ?',
      [id]
    );

    if (!editorial) {
      return res.status(404).json({
        error: 'Editorial no encontrada',
        message: `No existe una editorial con ID ${id}`
      });
    }

    // Verificar si tiene comics asociados
    const comicsCount = await getOne(
      'SELECT COUNT(*) as count FROM comics WHERE editorial_id = ?',
      [id]
    );

    if (comicsCount.count > 0) {
      return res.status(400).json({
        error: 'Editorial con comics asociados',
        message: `No se puede eliminar la editorial "${editorial.nombre}" porque tiene ${comicsCount.count} comic(s) asociado(s)`,
        comicsCount: comicsCount.count
      });
    }

    // Eliminar editorial
    await runQuery(
      'DELETE FROM editoriales WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Editorial eliminada correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar editorial:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

module.exports = {
  getAllEditoriales,
  getEditorialById,
  createEditorial,
  updateEditorial,
  deleteEditorial
};
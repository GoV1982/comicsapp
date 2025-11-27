// backend/controllers/perfilController.js
const { runQuery, getOne, getAll } = require('../config/database');
const bcrypt = require('bcrypt');

// Obtener perfil del cliente
const getPerfil = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    const cliente = await getOne(
      'SELECT id, nombre, email, telefono, whatsapp, direccion, notas, fecha_creacion, ultimo_acceso FROM clientes WHERE id = ?',
      [clienteId]
    );

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: 'Tu perfil no fue encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Actualizar perfil del cliente
const updatePerfil = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { nombre, telefono, whatsapp, direccion, notas } = req.body;

    // Validar datos
    const updates = {};

    if (nombre && nombre.trim().length > 0) {
      updates.nombre = nombre.trim();
    }

    if (telefono !== undefined) {
      updates.telefono = telefono && telefono.trim() !== '' ? telefono.trim() : null;
    }

    if (whatsapp !== undefined) {
      updates.whatsapp = whatsapp && whatsapp.trim() !== '' ? whatsapp.trim() : null;
    }

    if (direccion !== undefined) {
      updates.direccion = direccion && direccion.trim() !== '' ? direccion.trim() : null;
    }

    if (notas !== undefined) {
      updates.notas = notas && notas.trim() !== '' ? notas.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'No se proporcionaron datos válidos para actualizar'
      });
    }

    // Construir query de actualización
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(clienteId);

    await runQuery(
      `UPDATE clientes SET ${setClause} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Cambiar contraseña del cliente
const changePassword = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren la contraseña actual y la nueva'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener cliente con contraseña actual
    const cliente = await getOne('SELECT password FROM clientes WHERE id = ?', [clienteId]);

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: 'Tu perfil no fue encontrado'
      });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, cliente.password);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await runQuery('UPDATE clientes SET password = ? WHERE id = ?', [hashedPassword, clienteId]);

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Obtener historial de compras del cliente
const getHistorialCompras = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Obtener ventas del cliente con detalles
    const ventas = await getAll(`
      SELECT
        v.id,
        v.fecha_venta,
        v.total,
        v.metodo_pago as estado, -- Usar metodo_pago como estado o ajustar según schema
        COUNT(vd.id) as cantidad_items
      FROM ventas v
      LEFT JOIN ventas_detalle vd ON v.id = vd.venta_id
      WHERE v.cliente_id = ?
      GROUP BY v.id, v.fecha_venta, v.total, v.metodo_pago
      ORDER BY v.fecha_venta DESC
      LIMIT ? OFFSET ?
    `, [clienteId, limitNum, offset]);

    // Obtener total de ventas para paginación
    const totalResult = await getOne(
      'SELECT COUNT(*) as total FROM ventas WHERE cliente_id = ?',
      [clienteId]
    );
    const total = totalResult?.total || 0;

    // Para cada venta, obtener los items
    for (let venta of ventas) {
      const items = await getAll(`
        SELECT
          vd.cantidad,
          vd.precio_unitario,
          vd.subtotal,
          c.titulo,
          c.numero_edicion,
          e.nombre as editorial_nombre
        FROM ventas_detalle vd
        JOIN comics c ON vd.comic_id = c.id
        JOIN editoriales e ON c.editorial_id = e.id
        WHERE vd.venta_id = ?
      `, [venta.id]);

      venta.items = items;
    }

    res.json({
      success: true,
      data: {
        ventas: ventas,
        paginacion: {
          pagina_actual: pageNum,
          total_paginas: Math.ceil(total / limitNum),
          total_ventas: total,
          limite: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener historial de compras:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Eliminar cuenta del cliente (soft delete - marcar como inactivo)
const deleteAccount = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    // Verificar si tiene ventas activas o reservas
    const ventasActivas = await getOne(
      'SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ? AND metodo_pago = "Pendiente"',
      [clienteId]
    );

    if (ventasActivas && ventasActivas.count > 0) {
      return res.status(400).json({
        error: 'Cuenta con ventas pendientes',
        message: 'No puedes eliminar tu cuenta mientras tengas ventas pendientes'
      });
    }

    // Marcar como inactivo (podríamos agregar un campo 'activo' en el futuro)
    // Por ahora, simplemente cambiamos el email para "desactivar" la cuenta
    const emailInactivo = `deleted_${Date.now()}_${clienteId}@deleted.com`;
    await runQuery('UPDATE clientes SET email = ? WHERE id = ?', [emailInactivo, clienteId]);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

module.exports = {
  getPerfil,
  updatePerfil,
  changePassword,
  getHistorialCompras,
  deleteAccount
};

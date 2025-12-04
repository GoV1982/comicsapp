const { getAll, getOne, runQuery, db } = require('../config/database');
const {
  registrarIngresoVenta,
  actualizarIngresoVenta,
  eliminarIngresoVenta,
} = require('./contabilidadController');

// Obtener todas las ventas
const getAllVentas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, cliente_id } = req.query;

    let query = `
      SELECT 
        v.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.whatsapp as cliente_whatsapp,
        (SELECT COUNT(*) FROM ventas_detalle WHERE venta_id = v.id) as items_count
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha_inicio) {
      query += ' AND DATE(v.fecha_venta) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ' AND DATE(v.fecha_venta) <= DATE(?)';
      params.push(fecha_fin);
    }

    if (cliente_id) {
      query += ' AND v.cliente_id = ?';
      params.push(cliente_id);
    }

    query += ' ORDER BY v.fecha_venta DESC';

    const ventas = await getAll(query, params);

    res.json({
      success: true,
      data: ventas,
      count: ventas.length,
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Obtener una venta por ID con detalle
const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await getOne(
      `SELECT 
        v.*,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        c.telefono as cliente_telefono,
        c.whatsapp as cliente_whatsapp
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ?`,
      [id]
    );

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No existe una venta con ID ${id}`,
      });
    }

    // Obtener detalle de la venta
    const detalle = await getAll(
      `SELECT 
        vd.*,
        co.titulo as comic_titulo,
        co.numero_edicion,
        e.nombre as editorial_nombre
      FROM ventas_detalle vd
      LEFT JOIN comics co ON vd.comic_id = co.id
      LEFT JOIN editoriales e ON co.editorial_id = e.id
      WHERE vd.venta_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...venta,
        detalle,
      },
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Crear nueva venta (con transacción better-sqlite3)
const createVenta = async (req, res) => {
  try {
    const { metodo_pago, notas, items, estado } = req.body;
    // Obtener cliente_id del middleware de autenticación o del body (para admin)
    const cliente_id = req.cliente?.id || req.body.cliente_id;

    // Validar datos
    if (!metodo_pago || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere método de pago y al menos un item',
      });
    }

    // Validar cada item
    for (const item of items) {
      if (!item.comic_id || !item.cantidad || !item.precio_unitario) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Cada item debe tener comic_id, cantidad y precio_unitario',
        });
      }

      if (item.cantidad <= 0) {
        return res.status(400).json({
          error: 'Cantidad inválida',
          message: 'La cantidad debe ser mayor a 0',
        });
      }
    }

    // Verificar stock disponible para cada item (solo si no es pre-orden)
    if (estado !== 'pendiente') {
      for (const item of items) {
        const stock = await getOne(
          'SELECT cantidad_disponible FROM stock WHERE comic_id = ?',
          [item.comic_id]
        );

        if (!stock) {
          return res.status(400).json({
            error: 'Stock no encontrado',
            message: `No se encontró stock para el comic ID ${item.comic_id}`,
          });
        }

        if (stock.cantidad_disponible < item.cantidad) {
          const comic = await getOne('SELECT titulo FROM comics WHERE id = ?', [
            item.comic_id,
          ]);
          return res.status(400).json({
            error: 'Stock insuficiente',
            message: `No hay suficiente stock de "${comic?.titulo || 'comic'}". Disponible: ${stock.cantidad_disponible}, Solicitado: ${item.cantidad}`,
          });
        }
      }
    }

    // Calcular total
    const total = items.reduce(
      (sum, item) => {
        const subtotal = item.cantidad * item.precio_unitario;
        const descuento = item.descuento || 0;
        return sum + (subtotal * (1 - descuento / 100));
      },
      0
    );

    // Usar transacción better-sqlite3 (sincrónica)
    try {
      db.prepare('BEGIN TRANSACTION').run();

      try {
        // Insertar venta
        const ventaResult = db.prepare(
          'INSERT INTO ventas (cliente_id, total, metodo_pago, notas, estado) VALUES (?, ?, ?, ?, ?)'
        ).run(cliente_id || null, total, metodo_pago, notas || null, estado || 'completada');

        const ventaId = ventaResult.lastInsertRowid;

        // Insertar cada item del detalle
        const insertItem = db.prepare(
          'INSERT INTO ventas_detalle (venta_id, comic_id, cantidad, precio_unitario, subtotal, descuento) VALUES (?, ?, ?, ?, ?, ?)'
        );

        for (const item of items) {
          const descuento = item.descuento || 0;
          const subtotal = item.cantidad * item.precio_unitario * (1 - descuento / 100);

          insertItem.run(
            ventaId,
            item.comic_id,
            item.cantidad,
            item.precio_unitario,
            subtotal,
            descuento
          );

          // Actualizar stock si no es pendiente
          if (estado !== 'pendiente') {
            db.prepare('UPDATE stock SET cantidad_disponible = cantidad_disponible - ? WHERE comic_id = ?')
              .run(item.cantidad, item.comic_id);
          }
        }

        // Commit de la transacción
        db.prepare('COMMIT').run();

        // Registrar ingreso en contabilidad si está completada
        if (estado === 'completada') {
          try {
            registrarIngresoVenta(ventaId, total, metodo_pago, new Date().toISOString());
          } catch (contabError) {
            console.error('Error al registrar ingreso en contabilidad:', contabError);
          }
        }

        res.status(201).json({
          success: true,
          message: 'Venta registrada correctamente',
          data: {
            id: ventaId,
            total,
            items: items.length,
          },
        });
      } catch (error) {
        // Rollback en caso de error
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error en transacción de venta:', error);
      res.status(500).json({
        error: 'Error al procesar la venta',
        message: error.message,
      });
    }
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Eliminar venta (con transacción - devuelve stock)
const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const venta = await getOne('SELECT * FROM ventas WHERE id = ?', [id]);

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No existe una venta con ID ${id}`,
      });
    }

    // Obtener detalle para devolver el stock
    const detalle = await getAll(
      'SELECT comic_id, cantidad FROM ventas_detalle WHERE venta_id = ?',
      [id]
    );

    // Usar transacción better-sqlite3
    try {
      db.prepare('BEGIN TRANSACTION').run();

      try {
        // Devolver stock de cada item (si la venta no estaba pendiente, o si decidimos que pendiente no reserva stock)
        // Asumimos que si estaba completada, descontó stock. Si estaba pendiente, depende de la lógica.
        // Por simplicidad, devolvemos stock si NO es cancelada (o si la lógica de creación descontó)
        // La lógica de creación descuenta si estado !== 'pendiente'.

        if (venta.estado !== 'pendiente' && venta.estado !== 'cancelada') {
          const updateStock = db.prepare(
            'UPDATE stock SET cantidad_disponible = cantidad_disponible + ? WHERE comic_id = ?'
          );
          for (const item of detalle) {
            updateStock.run(item.cantidad, item.comic_id);
          }
        }

        // Eliminar la venta (el detalle se elimina por CASCADE si está configurado, sino manual)
        // SQLite por defecto no tiene ON DELETE CASCADE activado a menos que se configure.
        // Mejor eliminamos detalle manual para asegurar.
        db.prepare('DELETE FROM ventas_detalle WHERE venta_id = ?').run(id);
        db.prepare('DELETE FROM ventas WHERE id = ?').run(id);

        // Commit
        db.prepare('COMMIT').run();

        // Eliminar ingreso de contabilidad si existía
        if (venta.estado === 'completada') {
          try {
            eliminarIngresoVenta(id);
          } catch (contabError) {
            console.error('Error al eliminar ingreso de contabilidad:', contabError);
          }
        }

        res.json({
          success: true,
          message: 'Venta eliminada correctamente',
        });
      } catch (error) {
        db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      res.status(500).json({
        error: 'Error al eliminar venta',
        message: error.message,
      });
    }
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Obtener estadísticas de ventas
const getEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (fecha_inicio) {
      whereClause += ' AND DATE(fecha_venta) >= DATE(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClause += ' AND DATE(fecha_venta) <= DATE(?)';
      params.push(fecha_fin);
    }

    const stats = await getOne(
      `SELECT 
        COUNT(*) as total_ventas,
        COALESCE(SUM(total), 0) as total_vendido,
        COALESCE(AVG(total), 0) as promedio_venta,
        COALESCE(MAX(total), 0) as venta_mayor
      FROM ventas ${whereClause}`,
      params
    );

    const topComics = await getAll(
      `SELECT 
        c.titulo,
        c.numero_edicion,
        SUM(vd.cantidad) as cantidad_vendida,
        SUM(vd.subtotal) as total_vendido
      FROM ventas_detalle vd
      INNER JOIN comics c ON vd.comic_id = c.id
      INNER JOIN ventas v ON vd.venta_id = v.id
      ${whereClause}
      GROUP BY vd.comic_id, c.titulo, c.numero_edicion
      ORDER BY cantidad_vendida DESC
      LIMIT 5`,
      params
    );

    res.json({
      success: true,
      data: {
        ...stats,
        top_comics: topComics,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Actualizar venta
const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas, metodo_pago, items } = req.body;

    const venta = await getOne('SELECT * FROM ventas WHERE id = ?', [id]);

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada',
        message: `No existe una venta con ID ${id}`,
      });
    }

    // Si se envían items, hacemos una actualización completa (items + total + estado/notas)
    if (items && Array.isArray(items)) {
      try {
        db.prepare('BEGIN TRANSACTION').run();

        try {
          // 1. Revertir stock de items anteriores (si aplicaba)
          if (venta.estado !== 'pendiente') {
            const oldItems = db.prepare('SELECT * FROM ventas_detalle WHERE venta_id = ?').all(id);
            const updateStock = db.prepare('UPDATE stock SET cantidad_disponible = cantidad_disponible + ? WHERE comic_id = ?');
            for (const item of oldItems) {
              updateStock.run(item.cantidad, item.comic_id);
            }
          }

          // 2. Eliminar items anteriores
          db.prepare('DELETE FROM ventas_detalle WHERE venta_id = ?').run(id);

          // 3. Insertar nuevos items y calcular nuevo total
          let nuevoTotal = 0;
          const insertItem = db.prepare(
            'INSERT INTO ventas_detalle (venta_id, comic_id, cantidad, precio_unitario, subtotal, descuento) VALUES (?, ?, ?, ?, ?, ?)'
          );
          const deductStock = db.prepare('UPDATE stock SET cantidad_disponible = cantidad_disponible - ? WHERE comic_id = ?');

          for (const item of items) {
            const descuento = item.descuento || 0;
            const subtotal = item.cantidad * item.precio_unitario * (1 - descuento / 100);
            nuevoTotal += subtotal;

            insertItem.run(
              id,
              item.comic_id || item.comicId, // Handle both naming conventions if needed
              item.cantidad,
              item.precio_unitario || item.precio,
              subtotal,
              descuento
            );

            // Descontar stock si el NUEVO estado no es pendiente
            // Usamos el estado nuevo si viene, sino el viejo
            const finalEstado = estado || venta.estado;
            if (finalEstado !== 'pendiente') {
              deductStock.run(item.cantidad, item.comic_id || item.comicId);
            }
          }

          // 4. Actualizar venta principal
          let updates = ['total = ?'];
          let params = [nuevoTotal];

          if (estado) { updates.push('estado = ?'); params.push(estado); }
          if (notas !== undefined) { updates.push('notas = ?'); params.push(notas); }
          if (metodo_pago) { updates.push('metodo_pago = ?'); params.push(metodo_pago); }

          params.push(id);
          db.prepare(`UPDATE ventas SET ${updates.join(', ')} WHERE id = ?`).run(...params);

          db.prepare('COMMIT').run();

          // Actualizar o registrar ingreso en contabilidad
          const estadoFinal = estado || venta.estado;
          try {
            if (venta.estado === 'completada' && estadoFinal === 'completada') {
              // Actualizar monto si ya existía
              actualizarIngresoVenta(id, nuevoTotal, metodo_pago || venta.metodo_pago);
            } else if (venta.estado !== 'completada' && estadoFinal === 'completada') {
              // Crear nuevo ingreso si pasa a completada
              registrarIngresoVenta(id, nuevoTotal, metodo_pago || venta.metodo_pago, new Date().toISOString());
            } else if (venta.estado === 'completada' && (estadoFinal === 'cancelada' || estadoFinal === 'pendiente')) {
              // Eliminar ingreso si se cancela
              eliminarIngresoVenta(id);
            }
          } catch (contabError) {
            console.error('Error al actualizar contabilidad:', contabError);
          }

          res.json({ success: true, message: 'Venta actualizada correctamente', data: { total: nuevoTotal } });

        } catch (err) {
          db.prepare('ROLLBACK').run();
          throw err;
        }
      } catch (error) {
        console.error('Error en transacción de updateVenta:', error);
        return res.status(500).json({ error: 'Error al actualizar venta', message: error.message });
      }
    } else {
      // Actualización simple (solo estado/notas)
      let updates = [];
      let params = [];

      if (estado) {
        updates.push('estado = ?');
        params.push(estado);
      }

      if (notas !== undefined) {
        updates.push('notas = ?');
        params.push(notas);
      }

      if (metodo_pago) {
        updates.push('metodo_pago = ?');
        params.push(metodo_pago);
      }

      if (updates.length === 0) {
        return res.json({ success: true, message: 'No hay cambios para actualizar' });
      }

      params.push(id);

      const query = `UPDATE ventas SET ${updates.join(', ')} WHERE id = ?`;

      await runQuery(query, params);

      // Manejar cambios de estado en contabilidad
      if (estado) {
        try {
          if (venta.estado === 'completada' && estado === 'cancelada') {
            eliminarIngresoVenta(id);
          } else if (venta.estado !== 'completada' && estado === 'completada') {
            registrarIngresoVenta(id, venta.total, metodo_pago || venta.metodo_pago, new Date().toISOString());
          }
        } catch (contabError) {
          console.error('Error al actualizar contabilidad:', contabError);
        }
      }

      res.json({
        success: true,
        message: 'Venta actualizada correctamente',
      });
    }
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ error: 'Error en el servidor', message: error.message });
  }
};

module.exports = {
  // alias para compatibilidad con rutas que esperan getVentas
  getVentas: getAllVentas,
  getAllVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  getEstadisticas,
};
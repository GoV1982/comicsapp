// backend/controllers/ventasController.js
const { getAll, getOne, runQuery, db } = require('../config/database');

// Obtener todas las ventas
const getAllVentas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, cliente_id } = req.query;
    
    let query = `
      SELECT 
        v.*,
        c.nombre as cliente_nombre,
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
        c.telefono as cliente_telefono
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

// Crear nueva venta (con transacción)
const createVenta = async (req, res) => {
  try {
    const { cliente_id, metodo_pago, notas, items } = req.body;

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

    // Verificar stock disponible para cada item
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

    // Calcular total
    const total = items.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0
    );

    // Usar transacción para asegurar integridad
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insertar venta
        db.run(
          'INSERT INTO ventas (cliente_id, total, metodo_pago, notas) VALUES (?, ?, ?, ?)',
          [cliente_id || null, total, metodo_pago, notas || null],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            const ventaId = this.lastID;

            // Insertar cada item del detalle
            let itemsInsertados = 0;
            let errorOcurred = false;

            items.forEach((item) => {
              if (errorOcurred) return;

              const subtotal = item.cantidad * item.precio_unitario;

              db.run(
                'INSERT INTO ventas_detalle (venta_id, comic_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [
                  ventaId,
                  item.comic_id,
                  item.cantidad,
                  item.precio_unitario,
                  subtotal,
                ],
                function (err) {
                  if (err) {
                    errorOcurred = true;
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  itemsInsertados++;

                  // Si se insertaron todos los items, hacer commit
                  if (itemsInsertados === items.length) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                      }

                      resolve({
                        success: true,
                        message: 'Venta registrada correctamente',
                        data: {
                          id: ventaId,
                          total,
                          items: items.length,
                        },
                      });
                    });
                  }
                }
              );
            });
          }
        );
      });
    })
      .then((result) => {
        res.status(201).json(result);
      })
      .catch((error) => {
        console.error('Error en transacción de venta:', error);
        res.status(500).json({
          error: 'Error al procesar la venta',
          message: error.message,
        });
      });
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

    // Usar transacción
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Devolver stock de cada item
        let itemsProcesados = 0;
        let errorOcurred = false;

        if (detalle.length === 0) {
          // No hay detalle, solo eliminar la venta
          db.run('DELETE FROM ventas WHERE id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              resolve({ success: true, message: 'Venta eliminada' });
            });
          });
        } else {
          detalle.forEach((item) => {
            if (errorOcurred) return;

            db.run(
              'UPDATE stock SET cantidad_disponible = cantidad_disponible + ? WHERE comic_id = ?',
              [item.cantidad, item.comic_id],
              (err) => {
                if (err) {
                  errorOcurred = true;
                  db.run('ROLLBACK');
                  return reject(err);
                }

                itemsProcesados++;

                if (itemsProcesados === detalle.length) {
                  // Eliminar la venta (el detalle se elimina por CASCADE)
                  db.run('DELETE FROM ventas WHERE id = ?', [id], (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                      }

                      resolve({
                        success: true,
                        message: 'Venta eliminada correctamente',
                      });
                    });
                  });
                }
              }
            );
          });
        }
      });
    })
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        console.error('Error al eliminar venta:', error);
        res.status(500).json({
          error: 'Error al eliminar venta',
          message: error.message,
        });
      });
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

module.exports = {
  getAllVentas,
  getVentaById,
  createVenta,
  deleteVenta,
  getEstadisticas,
};
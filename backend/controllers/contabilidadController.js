const { getAll, getOne, runQuery, db } = require('../config/database');

// Obtener todos los movimientos contables
const getAllMovimientos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, tipo, categoria } = req.query;

        let query = `
      SELECT 
        mc.*,
        v.id as venta_numero,
        v.cliente_id,
        c.nombre as cliente_nombre,
        e.nombre as editorial_nombre
      FROM movimientos_contables mc
      LEFT JOIN ventas v ON mc.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN editoriales e ON mc.editorial_id = e.id
      WHERE 1=1
    `;
        const params = [];

        if (fecha_inicio) {
            query += ' AND DATE(mc.fecha) >= DATE(?)';
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            query += ' AND DATE(mc.fecha) <= DATE(?)';
            params.push(fecha_fin);
        }

        if (tipo) {
            query += ' AND mc.tipo = ?';
            params.push(tipo);
        }

        if (categoria) {
            query += ' AND mc.categoria = ?';
            params.push(categoria);
        }

        query += ' ORDER BY mc.fecha DESC, mc.id DESC';

        const movimientos = await getAll(query, params);

        res.json({
            success: true,
            data: movimientos,
            count: movimientos.length,
        });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Obtener un movimiento por ID
const getMovimientoById = async (req, res) => {
    try {
        const { id } = req.params;

        const movimiento = await getOne(
            `SELECT 
        mc.*,
        v.id as venta_numero,
        e.nombre as editorial_nombre
      FROM movimientos_contables mc
      LEFT JOIN ventas v ON mc.venta_id = v.id
      LEFT JOIN editoriales e ON mc.editorial_id = e.id
      WHERE mc.id = ?`,
            [id]
        );

        if (!movimiento) {
            return res.status(404).json({
                error: 'Movimiento no encontrado',
                message: `No existe un movimiento con ID ${id}`,
            });
        }

        res.json({
            success: true,
            data: movimiento,
        });
    } catch (error) {
        console.error('Error al obtener movimiento:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Crear nuevo movimiento (principalmente para egresos manuales)
const createMovimiento = async (req, res) => {
    try {
        const {
            tipo,
            monto,
            fecha,
            categoria,
            descripcion,
            metodo_pago,
            proveedor,
            comprobante,
            editorial_id,
        } = req.body;

        // Validar datos
        if (!tipo || !monto || !categoria) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Se requiere tipo, monto y categoría',
            });
        }

        if (!['ingreso', 'egreso'].includes(tipo)) {
            return res.status(400).json({
                error: 'Tipo inválido',
                message: 'El tipo debe ser "ingreso" o "egreso"',
            });
        }

        if (monto <= 0) {
            return res.status(400).json({
                error: 'Monto inválido',
                message: 'El monto debe ser mayor a 0',
            });
        }

        const result = db.prepare(
            `INSERT INTO movimientos_contables 
      (tipo, monto, fecha, categoria, descripcion, metodo_pago, proveedor, comprobante, editorial_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            tipo,
            monto,
            fecha || new Date().toISOString(),
            categoria,
            descripcion || null,
            metodo_pago || null,
            proveedor || null,
            comprobante || null,
            editorial_id || null
        );

        res.status(201).json({
            success: true,
            message: 'Movimiento registrado correctamente',
            data: {
                id: result.lastInsertRowid,
                tipo,
                monto,
                categoria,
            },
        });
    } catch (error) {
        console.error('Error al crear movimiento:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Actualizar movimiento
const updateMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            monto,
            fecha,
            categoria,
            descripcion,
            metodo_pago,
            proveedor,
            comprobante,
            editorial_id,
        } = req.body;

        const movimiento = await getOne(
            'SELECT * FROM movimientos_contables WHERE id = ?',
            [id]
        );

        if (!movimiento) {
            return res.status(404).json({
                error: 'Movimiento no encontrado',
                message: `No existe un movimiento con ID ${id}`,
            });
        }

        // No permitir editar movimientos automáticos de ventas
        if (movimiento.venta_id) {
            return res.status(400).json({
                error: 'No se puede editar',
                message: 'Los movimientos generados automáticamente por ventas no se pueden editar manualmente',
            });
        }

        let updates = [];
        let params = [];

        if (monto !== undefined) {
            if (monto <= 0) {
                return res.status(400).json({
                    error: 'Monto inválido',
                    message: 'El monto debe ser mayor a 0',
                });
            }
            updates.push('monto = ?');
            params.push(monto);
        }

        if (fecha) {
            updates.push('fecha = ?');
            params.push(fecha);
        }

        if (categoria) {
            updates.push('categoria = ?');
            params.push(categoria);
        }

        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            params.push(descripcion);
        }

        if (metodo_pago !== undefined) {
            updates.push('metodo_pago = ?');
            params.push(metodo_pago);
        }

        if (proveedor !== undefined) {
            updates.push('proveedor = ?');
            params.push(proveedor);
        }

        if (comprobante !== undefined) {
            updates.push('comprobante = ?');
            params.push(comprobante);
        }

        if (editorial_id !== undefined) {
            updates.push('editorial_id = ?');
            params.push(editorial_id);
        }

        if (updates.length === 0) {
            return res.json({ success: true, message: 'No hay cambios para actualizar' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const query = `UPDATE movimientos_contables SET ${updates.join(', ')} WHERE id = ?`;

        await runQuery(query, params);

        res.json({
            success: true,
            message: 'Movimiento actualizado correctamente',
        });
    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Eliminar movimiento
const deleteMovimiento = async (req, res) => {
    try {
        const { id } = req.params;

        const movimiento = await getOne(
            'SELECT * FROM movimientos_contables WHERE id = ?',
            [id]
        );

        if (!movimiento) {
            return res.status(404).json({
                error: 'Movimiento no encontrado',
                message: `No existe un movimiento con ID ${id}`,
            });
        }

        // No permitir eliminar movimientos automáticos de ventas
        if (movimiento.venta_id) {
            return res.status(400).json({
                error: 'No se puede eliminar',
                message: 'Los movimientos generados automáticamente por ventas no se pueden eliminar manualmente. Cancele la venta correspondiente.',
            });
        }

        await runQuery('DELETE FROM movimientos_contables WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Movimiento eliminado correctamente',
        });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Obtener estadísticas y resumen contable
const getEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (fecha_inicio) {
            whereClause += ' AND DATE(fecha) >= DATE(?)';
            params.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereClause += ' AND DATE(fecha) <= DATE(?)';
            params.push(fecha_fin);
        }

        // Resumen general
        const resumen = await getOne(
            `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) as total_ingresos,
        COALESCE(SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END), 0) as total_egresos,
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance,
        COUNT(CASE WHEN tipo = 'ingreso' THEN 1 END) as cantidad_ingresos,
        COUNT(CASE WHEN tipo = 'egreso' THEN 1 END) as cantidad_egresos
      FROM movimientos_contables ${whereClause}`,
            params
        );

        // Ingresos por categoría
        const ingresosPorCategoria = await getAll(
            `SELECT 
        categoria,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM movimientos_contables
      ${whereClause} AND tipo = 'ingreso'
      GROUP BY categoria
      ORDER BY total DESC`,
            params
        );

        // Egresos por categoría
        const egresosPorCategoria = await getAll(
            `SELECT 
        categoria,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM movimientos_contables
      ${whereClause} AND tipo = 'egreso'
      GROUP BY categoria
      ORDER BY total DESC`,
            params
        );

        // Evolución mensual
        const evolucionMensual = await getAll(
            `SELECT 
        strftime('%Y-%m', fecha) as mes,
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) as egresos,
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
      FROM movimientos_contables
      ${whereClause}
      GROUP BY strftime('%Y-%m', fecha)
      ORDER BY mes DESC
      LIMIT 12`,
            params
        );

        // Top proveedores/editoriales (egresos)
        const topProveedores = await getAll(
            `SELECT 
        COALESCE(proveedor, 'Sin especificar') as nombre,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM movimientos_contables
      ${whereClause} AND tipo = 'egreso'
      GROUP BY proveedor
      ORDER BY total DESC
      LIMIT 10`,
            params
        );

        res.json({
            success: true,
            data: {
                resumen,
                ingresos_por_categoria: ingresosPorCategoria,
                egresos_por_categoria: egresosPorCategoria,
                evolucion_mensual: evolucionMensual,
                top_proveedores: topProveedores,
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

// Función helper para registrar ingreso por venta (usado por ventasController)
const registrarIngresoVenta = (ventaId, monto, metodo_pago, fecha) => {
    try {
        const result = db.prepare(
            `INSERT INTO movimientos_contables 
      (tipo, monto, fecha, categoria, descripcion, metodo_pago, venta_id) 
      VALUES ('ingreso', ?, ?, 'Ventas de comics', ?, ?, ?)`
        ).run(
            monto,
            fecha || new Date().toISOString(),
            `Ingreso por venta #${ventaId}`,
            metodo_pago,
            ventaId
        );

        return result.lastInsertRowid;
    } catch (error) {
        console.error('Error al registrar ingreso de venta:', error);
        throw error;
    }
};

// Función helper para actualizar ingreso por venta
const actualizarIngresoVenta = (ventaId, nuevoMonto, metodo_pago) => {
    try {
        const result = db.prepare(
            `UPDATE movimientos_contables 
      SET monto = ?, metodo_pago = ?, updated_at = CURRENT_TIMESTAMP
      WHERE venta_id = ? AND tipo = 'ingreso'`
        ).run(nuevoMonto, metodo_pago, ventaId);

        return result.changes;
    } catch (error) {
        console.error('Error al actualizar ingreso de venta:', error);
        throw error;
    }
};

// Función helper para eliminar ingreso por venta (al cancelar/eliminar)
const eliminarIngresoVenta = (ventaId) => {
    try {
        const result = db.prepare(
            'DELETE FROM movimientos_contables WHERE venta_id = ? AND tipo = \'ingreso\''
        ).run(ventaId);

        return result.changes;
    } catch (error) {
        console.error('Error al eliminar ingreso de venta:', error);
        throw error;
    }
};

module.exports = {
    getAllMovimientos,
    getMovimientoById,
    createMovimiento,
    updateMovimiento,
    deleteMovimiento,
    getEstadisticas,
    // Exportar funciones helper para usar en ventasController
    registrarIngresoVenta,
    actualizarIngresoVenta,
    eliminarIngresoVenta,
};

// backend/controllers/carritoController.js
const { runQuery, getOne, getAll } = require('../config/database');

// Función helper para obtener o crear carrito
const getOrCreateCarrito = async (clienteId = null, sessionId = null) => {
  let carrito;

  if (clienteId) {
    // Buscar carrito del cliente
    carrito = await getOne('SELECT id FROM carritos WHERE cliente_id = ?', [clienteId]);
    if (!carrito) {
      // Crear carrito para cliente
      const result = await runQuery('INSERT INTO carritos (cliente_id) VALUES (?)', [clienteId]);
      carrito = { id: result.id };
    }
  } else if (sessionId) {
    // Buscar carrito anónimo
    carrito = await getOne('SELECT id FROM carritos WHERE session_id = ?', [sessionId]);
    if (!carrito) {
      // Crear carrito anónimo
      const result = await runQuery('INSERT INTO carritos (session_id) VALUES (?)', [sessionId]);
      carrito = { id: result.id };
    }
  }

  return carrito;
};

// Obtener carrito del cliente autenticado o anónimo
const getCarrito = async (req, res) => {
  try {
    const clienteId = req.cliente?.id; // Puede ser undefined para anónimo
    const sessionId = req.headers['x-session-id']; // Para carrito anónimo si no está logueado

    if (!clienteId && !sessionId) {
      return res.status(400).json({
        error: 'Datos insuficientes',
        message: 'Se requiere cliente autenticado o sessionId para carrito anónimo'
      });
    }

    const carrito = await getOrCreateCarrito(clienteId, sessionId);

    // Obtener items del carrito
    const items = await getAll(`
      SELECT
        ci.id,
        ci.cantidad,
        ci.precio_unitario,
        c.id as comic_id,
        c.titulo,
        c.numero_edicion,
        c.imagen_url,
        c.precio,
        e.nombre as editorial_nombre,
        (ci.cantidad * COALESCE(ci.precio_unitario, 0)) as subtotal
      FROM carritos_items ci
      JOIN comics c ON ci.comic_id = c.id
      JOIN editoriales e ON c.editorial_id = e.id
      WHERE ci.carrito_id = ?
      ORDER BY ci.fecha_agregado DESC
    `, [carrito.id]);

    // Calcular total
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        carrito_id: carrito.id,
        items: items,
        total: total,
        cantidad_items: items.length
      }
    });

  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Agregar item al carrito
const addToCarrito = async (req, res) => {
  try {
    const { comic_id, cantidad = 1 } = req.body;
    const clienteId = req.cliente?.id;
    const sessionId = req.headers['x-session-id'];

    if (!comic_id) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere el ID del cómic'
      });
    }

    // Verificar que el cómic existe
    const comic = await getOne(
      'SELECT id, titulo, precio, estado FROM comics WHERE id = ?',
      [comic_id]
    );

    if (!comic) {
      return res.status(404).json({
        error: 'Cómic no encontrado',
        message: 'El cómic no existe o no está disponible'
      });
    }

    // Solo verificar stock si el cómic está marcado como "Disponible"
    if (comic.estado === 'Disponible') {
      const stock = await getOne('SELECT cantidad_disponible FROM stock WHERE comic_id = ?', [comic_id]);
      if (!stock || stock.cantidad_disponible < cantidad) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          message: `Solo hay ${stock?.cantidad_disponible || 0} unidades disponibles`
        });
      }
    }

    // Obtener o crear carrito
    const carrito = await getOrCreateCarrito(clienteId, sessionId);

    // Verificar si el item ya existe en el carrito
    const itemExistente = await getOne(
      'SELECT id, cantidad FROM carritos_items WHERE carrito_id = ? AND comic_id = ?',
      [carrito.id, comic_id]
    );

    if (itemExistente) {
      // Actualizar cantidad
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      await runQuery(
        'UPDATE carritos_items SET cantidad = ?, fecha_agregado = CURRENT_TIMESTAMP WHERE id = ?',
        [nuevaCantidad, itemExistente.id]
      );
    } else {
      // Agregar nuevo item
      await runQuery(
        'INSERT INTO carritos_items (carrito_id, comic_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [carrito.id, comic_id, cantidad, comic.precio]
      );
    }

    // Actualizar timestamp del carrito
    await runQuery('UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [carrito.id]);

    res.json({
      success: true,
      message: 'Item agregado al carrito exitosamente'
    });

  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Actualizar cantidad de item en carrito
const updateCarritoItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad } = req.body;
    const clienteId = req.cliente?.id;
    const sessionId = req.headers['x-session-id'];

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Verificar que el item pertenece al carrito del usuario
    const carrito = await getOrCreateCarrito(clienteId, sessionId);
    const item = await getOne(
      'SELECT ci.id, ci.comic_id, c.titulo FROM carritos_items ci JOIN comics c ON ci.comic_id = c.id WHERE ci.id = ? AND ci.carrito_id = ?',
      [itemId, carrito.id]
    );

    if (!item) {
      return res.status(404).json({
        error: 'Item no encontrado',
        message: 'El item no existe en tu carrito'
      });
    }

    // Verificar stock disponible solo para comics con estado "Disponible"
    const comic = await getOne('SELECT estado FROM comics WHERE id = ?', [item.comic_id]);
    if (comic.estado === 'Disponible') {
      const stock = await getOne('SELECT cantidad_disponible FROM stock WHERE comic_id = ?', [item.comic_id]);
      if (!stock || stock.cantidad_disponible < cantidad) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          message: `Solo hay ${stock?.cantidad_disponible || 0} unidades disponibles de "${item.titulo}"`
        });
      }
    }

    // Actualizar cantidad
    await runQuery('UPDATE carritos_items SET cantidad = ? WHERE id = ?', [cantidad, itemId]);

    // Actualizar timestamp del carrito
    await runQuery('UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [carrito.id]);

    res.json({
      success: true,
      message: 'Cantidad actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar item del carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Eliminar item del carrito
const removeFromCarrito = async (req, res) => {
  try {
    const { itemId } = req.params;
    const clienteId = req.cliente?.id;
    const sessionId = req.headers['x-session-id'];

    // Verificar que el item pertenece al carrito del usuario
    const carrito = await getOrCreateCarrito(clienteId, sessionId);
    const item = await getOne(
      'SELECT id FROM carritos_items WHERE id = ? AND carrito_id = ?',
      [itemId, carrito.id]
    );

    if (!item) {
      return res.status(404).json({
        error: 'Item no encontrado',
        message: 'El item no existe en tu carrito'
      });
    }

    // Eliminar item
    await runQuery('DELETE FROM carritos_items WHERE id = ?', [itemId]);

    // Actualizar timestamp del carrito
    await runQuery('UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [carrito.id]);

    res.json({
      success: true,
      message: 'Item eliminado del carrito exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar item del carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Vaciar carrito
const clearCarrito = async (req, res) => {
  try {
    const clienteId = req.cliente?.id;
    const sessionId = req.headers['x-session-id'];

    const carrito = await getOrCreateCarrito(clienteId, sessionId);

    // Eliminar todos los items
    await runQuery('DELETE FROM carritos_items WHERE carrito_id = ?', [carrito.id]);

    // Actualizar timestamp del carrito
    await runQuery('UPDATE carritos SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [carrito.id]);

    res.json({
      success: true,
      message: 'Carrito vaciado exitosamente'
    });

  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Transferir carrito anónimo a cliente autenticado
const transferCarrito = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.json({
        success: true,
        message: 'No hay carrito anónimo para transferir'
      });
    }

    // Buscar carrito anónimo
    const carritoAnonimo = await getOne('SELECT id FROM carritos WHERE session_id = ?', [sessionId]);
    if (!carritoAnonimo) {
      return res.json({
        success: true,
        message: 'No hay carrito anónimo para transferir'
      });
    }

    // Verificar si el cliente ya tiene carrito
    const carritoCliente = await getOne('SELECT id FROM carritos WHERE cliente_id = ?', [clienteId]);

    if (carritoCliente) {
      // Transferir items del carrito anónimo al carrito del cliente
      // Primero, manejar items que ya existen (sumar cantidades)
      const itemsAnonimos = await getAll('SELECT comic_id, cantidad FROM carritos_items WHERE carrito_id = ?', [carritoAnonimo.id]);

      for (const item of itemsAnonimos) {
        const itemExistente = await getOne(
          'SELECT id, cantidad FROM carritos_items WHERE carrito_id = ? AND comic_id = ?',
          [carritoCliente.id, item.comic_id]
        );

        if (itemExistente) {
          // Actualizar cantidad existente
          await runQuery(
            'UPDATE carritos_items SET cantidad = cantidad + ? WHERE id = ?',
            [item.cantidad, itemExistente.id]
          );
        } else {
          // Insertar nuevo item
          await runQuery(
            'INSERT INTO carritos_items (carrito_id, comic_id, cantidad, precio_unitario) SELECT ?, comic_id, cantidad, precio_unitario FROM carritos_items WHERE id = ?',
            [carritoCliente.id, item.id]
          );
        }
      }

      // Eliminar carrito anónimo
      await runQuery('DELETE FROM carritos WHERE id = ?', [carritoAnonimo.id]);

    } else {
      // Asignar carrito anónimo al cliente
      await runQuery('UPDATE carritos SET cliente_id = ?, session_id = NULL WHERE id = ?', [clienteId, carritoAnonimo.id]);
    }

    res.json({
      success: true,
      message: 'Carrito transferido exitosamente'
    });

  } catch (error) {
    console.error('Error al transferir carrito:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

module.exports = {
  getCarrito,
  addToCarrito,
  updateCarritoItem,
  removeFromCarrito,
  clearCarrito,
  transferCarrito
};

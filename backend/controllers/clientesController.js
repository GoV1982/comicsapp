// backend/controllers/clientesController.js
const { runQuery, getOne, getAll } = require('../config/database'); // ajusta si tu helper tiene otro nombre

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY fecha_creacion DESC';

    const clientes = await getAll(query, params);

    res.json({
      success: true,
      data: clientes,
      count: clientes.length,
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Obtener un cliente por ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await getOne('SELECT * FROM clientes WHERE id = ?', [id]);

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No existe un cliente con ID ${id}`,
      });
    }

    res.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Crear nuevo cliente
const createCliente = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, notas } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre del cliente es requerido',
      });
    }

    if (email && email.trim() !== '') {
      const exists = await getOne('SELECT id FROM clientes WHERE email = ?', [email.trim()]);
      if (exists) {
        return res.status(400).json({
          error: 'Email duplicado',
          message: 'Ya existe un cliente con ese email',
        });
      }
    }

    const result = await runQuery(
      'INSERT INTO clientes (nombre, email, telefono, direccion, notas) VALUES (?, ?, ?, ?, ?)',
      [
        nombre.trim(), 
        email && email.trim() !== '' ? email.trim() : null, 
        telefono && telefono.trim() !== '' ? telefono.trim() : null, 
        direccion && direccion.trim() !== '' ? direccion.trim() : null, 
        notas && notas.trim() !== '' ? notas.trim() : null
      ]
    );

    const id = result.lastID ?? result.insertId ?? result.id ?? null;

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: {
        id,
        nombre: nombre.trim(),
        email: email ? email.trim() : null,
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        notas: notas ? notas.trim() : null,
      },
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, notas } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre del cliente es requerido',
      });
    }

    const cliente = await getOne('SELECT id FROM clientes WHERE id = ?', [id]);
    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: `No existe un cliente con ID ${id}`,
      });
    }

    if (email && email.trim() !== '') {
      const duplicate = await getOne('SELECT id FROM clientes WHERE email = ? AND id != ?', [email.trim(), id]);
      if (duplicate) {
        return res.status(400).json({
          error: 'Email duplicado',
          message: 'Ya existe otro cliente con ese email',
        });
      }
    }

    await runQuery(
      'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, direccion = ?, notas = ? WHERE id = ?',
      [
        nombre.trim(), 
        email && email.trim() !== '' ? email.trim() : null, 
        telefono && telefono.trim() !== '' ? telefono.trim() : null, 
        direccion && direccion.trim() !== '' ? direccion.trim() : null, 
        notas && notas.trim() !== '' ? notas.trim() : null, 
        id
      ]
    );

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: {
        id: Number(id),
        nombre: nombre.trim(),
        email: email ? email.trim() : null,
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        notas: notas ? notas.trim() : null,
      },
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

// Eliminar cliente
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await getOne('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado', message: `No existe un cliente con ID ${id}` });
    }

    const ventasCountRow = await getOne('SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?', [id]);
    const ventasCount = ventasCountRow?.count ?? 0;
    if (ventasCount > 0) {
      return res.status(400).json({
        error: 'Cliente con ventas asociadas',
        message: `No se puede eliminar "${cliente.nombre}" porque tiene ${ventasCount} venta(s) registrada(s)`,
        ventasCount,
      });
    }

    const reservasCountRow = await getOne('SELECT COUNT(*) as count FROM reservas WHERE cliente_id = ?', [id]);
    const reservasCount = reservasCountRow?.count ?? 0;
    if (reservasCount > 0) {
      return res.status(400).json({
        error: 'Cliente con reservas asociadas',
        message: `No se puede eliminar "${cliente.nombre}" porque tiene ${reservasCount} reserva(s) registrada(s)`,
        reservasCount,
      });
    }

    await runQuery('DELETE FROM clientes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message,
    });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};
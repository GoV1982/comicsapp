// backend/middleware/authCliente.js
const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');

const authCliente = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        message: 'Se requiere autenticación para acceder a este recurso'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar que sea un cliente (no admin)
      const cliente = await getOne(
        'SELECT id, nombre, email, email_verificado, ultimo_acceso FROM clientes WHERE id = ?',
        [decoded.id]
      );

      if (!cliente) {
        return res.status(401).json({
          error: 'Cliente no encontrado',
          message: 'El token no corresponde a un cliente válido'
        });
      }

      if (!cliente.email_verificado) {
        return res.status(403).json({
          error: 'Email no verificado',
          message: 'Debe verificar su email antes de continuar'
        });
      }

      // Actualizar último acceso
      const { runQuery } = require('../config/database');
      await runQuery('UPDATE clientes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [cliente.id]);

      // Agregar cliente al request
      req.cliente = {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        email_verificado: cliente.email_verificado,
        ultimo_acceso: cliente.ultimo_acceso
      };

      next();
    } catch (jwtError) {
      console.error('Error al verificar token JWT:', jwtError);
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token de autenticación es inválido o ha expirado'
      });
    }

  } catch (error) {
    console.error('Error en middleware authCliente:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Error interno del servidor'
    });
  }
};

module.exports = { authCliente };

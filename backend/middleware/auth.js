// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verificar token JWT
const verifyToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Token inválido',
          message: 'El token proporcionado no es válido o ha expirado'
        });
      }

      // Guardar datos del usuario en el request
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en autenticación',
      message: error.message 
    });
  }
};

// Verificar si es admin (para futuras expansiones)
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador'
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};
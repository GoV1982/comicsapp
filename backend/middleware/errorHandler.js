// backend/middleware/errorHandler.js

// Middleware para rutas no encontradas (404)
const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en el servidor`,
    path: req.originalUrl,
    method: req.method
  });
};

// Middleware para manejo de errores generales
const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err);

  // Error de base de datos SQLite
  if (err.code && err.code.includes('SQLITE')) {
    return res.status(500).json({
      error: 'Error de base de datos',
      message: 'Ocurrió un error al procesar la solicitud en la base de datos',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'La sesión ha expirado, por favor inicia sesión nuevamente'
    });
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }

  // Error genérico
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: 'Error en el servidor',
    message: err.message || 'Ocurrió un error inesperado',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  notFound,
  errorHandler
};
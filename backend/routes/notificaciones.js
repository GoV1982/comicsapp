const express = require('express');
const router = express.Router();
const { authCliente } = require('../middleware/authCliente');

const {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion
} = require('../controllers/notificacionesController');

// Todas las rutas requieren autenticación de cliente
router.use(authCliente);

// Obtener notificaciones del usuario
router.get('/', getNotificaciones);

// Marcar notificación específica como leída
router.put('/:notificacionId/leida', marcarLeida);

// Marcar todas las notificaciones como leídas
router.put('/marcar-todas-leidas', marcarTodasLeidas);

// Eliminar notificación
router.delete('/:notificacionId', eliminarNotificacion);

module.exports = router;

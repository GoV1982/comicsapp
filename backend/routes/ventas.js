// backend/routes/ventas.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAllVentas,
  getVentaById,
  createVenta,
  deleteVenta,
  getEstadisticas,
} = require('../controllers/ventasController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getAllVentas);
router.get('/estadisticas', getEstadisticas);
router.get('/:id', getVentaById);
router.post('/', createVenta);
router.delete('/:id', deleteVenta);

module.exports = router;
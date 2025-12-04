const express = require('express');
const router = express.Router();
const {
    getAllMovimientos,
    getMovimientoById,
    createMovimiento,
    updateMovimiento,
    deleteMovimiento,
    getEstadisticas,
} = require('../controllers/contabilidadController');
const { auth } = require('../middleware/auth');

// Todas las rutas requieren autenticación de administrador
router.use(auth);

// Obtener estadísticas y resumen
router.get('/estadisticas', getEstadisticas);

// CRUD de movimientos
router.get('/', getAllMovimientos);
router.get('/:id', getMovimientoById);
router.post('/', createMovimiento);
router.put('/:id', updateMovimiento);
router.delete('/:id', deleteMovimiento);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    getAllTasas,
    updateTasa,
    getTasaByMoneda,
} = require('../controllers/tasasCambioController');
const { auth } = require('../middleware/auth');

// Rutas públicas (para que los clientes puedan obtener las tasas)
router.get('/', getAllTasas);
router.get('/:moneda', getTasaByMoneda);

// Rutas protegidas (solo admin puede actualizar tasas)
router.put('/:moneda', auth, updateTasa);

module.exports = router;

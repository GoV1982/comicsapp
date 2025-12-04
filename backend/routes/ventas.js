// backend/routes/ventas.js
const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

let authMiddleware;
try {
  authMiddleware = require('../middleware/authMiddleware');
  if (typeof authMiddleware !== 'function') throw new Error('authMiddleware no exporta una función');
} catch (err) {
  console.warn('authMiddleware no encontrado o inválido — rutas protegidas no aplicarán autenticación:', err.message);
  authMiddleware = (req, res, next) => next();
}

// Cliente authentication middleware
let authCliente;
try {
  const authClienteModule = require('../middleware/authCliente');
  authCliente = authClienteModule.authCliente;
  if (typeof authCliente !== 'function') throw new Error('authCliente no es una función');
} catch (err) {
  console.warn('authCliente no encontrado o inválido:', err.message);
  authCliente = (req, res, next) => next();
}

// Verificar que el controlador exporte las funciones esperadas
const requiredFns = ['getVentas', 'getVentaById', 'createVenta', 'updateVenta', 'deleteVenta'];
for (const fn of requiredFns) {
  if (typeof ventasController[fn] !== 'function') {
    throw new Error(`ventasController.${fn} no está definido — revisa controllers/ventasController.js`);
  }
}

// Rutas públicas y protegidas
router.get('/', ventasController.getVentas);
router.get('/:id', ventasController.getVentaById);

router.post('/', authCliente, ventasController.createVenta); // Clientes pueden crear pre-ordenes
router.put('/:id', authMiddleware, ventasController.updateVenta); // Solo admin
router.delete('/:id', authMiddleware, ventasController.deleteVenta); // Solo admin

module.exports = router;
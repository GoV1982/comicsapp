// backend/routes/clientes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

let authMiddleware;
try {
  authMiddleware = require('../middleware/authMiddleware');
  if (typeof authMiddleware !== 'function') {
    throw new Error('authMiddleware no exporta una función');
  }
} catch (err) {
  console.warn('authMiddleware no encontrado o inválido — rutas protegidas no aplicarán autenticación:', err.message);
  authMiddleware = (req, res, next) => next();
}

// Verificar funciones exportadas por el controlador
const requiredFns = ['getClientes', 'getClienteById', 'createCliente', 'updateCliente', 'deleteCliente'];
for (const fn of requiredFns) {
  if (typeof clientesController[fn] !== 'function') {
    throw new Error(`clientesController.${fn} no está definido — revisa controllers/clientesController.js`);
  }
}

// Rutas públicas / privadas
router.get('/', clientesController.getClientes);
router.get('/:id', clientesController.getClienteById);

router.post('/', authMiddleware, clientesController.createCliente);
router.put('/:id', authMiddleware, clientesController.updateCliente);
router.delete('/:id', authMiddleware, clientesController.deleteCliente);

module.exports = router;
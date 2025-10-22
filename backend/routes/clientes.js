// backend/routes/clientes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} = require('../controllers/clientesController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getAllClientes);
router.get('/:id', getClienteById);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

module.exports = router;
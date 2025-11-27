// backend/routes/carrito.js
const express = require('express');
const router = express.Router();
const { authCliente } = require('../middleware/authCliente');
const {
  getCarrito,
  addToCarrito,
  updateCarritoItem,
  removeFromCarrito,
  clearCarrito,
  transferCarrito
} = require('../controllers/carritoController');

// Rutas protegidas (requieren autenticación de cliente)
router.get('/', authCliente, getCarrito);
router.post('/add', authCliente, addToCarrito);
router.put('/item/:itemId', authCliente, updateCarritoItem);
router.delete('/item/:itemId', authCliente, removeFromCarrito);
router.delete('/clear', authCliente, clearCarrito);
router.post('/transfer', authCliente, transferCarrito);

// Rutas públicas para carrito anónimo (sin autenticación)
router.get('/anon', getCarrito);
router.post('/add-anon', addToCarrito);
router.delete('/anon/item/:itemId', removeFromCarrito);
router.put('/anon/item/:itemId', updateCarritoItem);
router.delete('/anon/clear', clearCarrito);

module.exports = router;

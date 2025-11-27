// backend/routes/perfil.js
const express = require('express');
const router = express.Router();
const { authCliente } = require('../middleware/authCliente');
const {
  getPerfil,
  updatePerfil,
  changePassword,
  getHistorialCompras,
  deleteAccount
} = require('../controllers/perfilController');

// Rutas protegidas (requieren autenticación de cliente)
router.get('/', authCliente, getPerfil);
router.put('/', authCliente, updatePerfil);
router.post('/change-password', authCliente, changePassword);
router.get('/historial-compras', authCliente, getHistorialCompras);
router.delete('/account', authCliente, deleteAccount);

module.exports = router;

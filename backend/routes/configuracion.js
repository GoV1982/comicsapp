const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authCliente } = require('../middleware/authCliente');
const {
  getConfiguracion,
  updateConfiguracion,
  addTituloFavorito,
  removeTituloFavorito,
  getTitulosFavoritos
} = require('../controllers/configuracionController');

const {
  getGlobalConfig,
  updateGlobalConfig
} = require('../controllers/adminConfiguracionController');

// Rutas protegidas (requieren autenticación de cliente)
router.get('/', authCliente, getConfiguracion);
router.put('/', authCliente, updateConfiguracion);
router.post('/favoritos', authCliente, addTituloFavorito);
router.delete('/favoritos/:comicId', authCliente, removeTituloFavorito);
router.get('/favoritos', authCliente, getTitulosFavoritos);

// Ruta pública para leer configuración global (WhatsApp, etc.)
router.get('/global', getGlobalConfig);

// Ruta protegida para admin (actualizar configuración global)
router.put('/global', auth, updateGlobalConfig);

module.exports = router;

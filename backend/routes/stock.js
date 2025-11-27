// backend/routes/stock.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

let authMiddleware;
try {
  authMiddleware = require('../middleware/authMiddleware');
} catch (e) {
  // Si no existe, usamos un passthrough para evitar que la app se caiga
  console.warn('authMiddleware no encontrado — rutas protegidas no aplicarán autenticación');
  authMiddleware = (req, res, next) => next();
}

// Verificar que las funciones esperadas existen en el controlador
const requiredFns = {
  list: 'getComics',
  getById: 'getStockByComicId',
  create: 'createComic',
  update: 'updateStock',
  adjust: 'adjustStock',
  summary: 'getStockSummary'
};

for (const name of Object.values(requiredFns)) {
  if (typeof stockController[name] !== 'function') {
    throw new Error(`stockController.${name} no está definido — revisa controllers/stockController.js`);
  }
}

// Rutas
router.get('/', stockController.getAllStock); // lista de stock
router.get('/summary', stockController.getStockSummary); // resumen
router.get('/comic/:comic_id', stockController.getStockByComicId); // detalle por comicId

// Rutas protegidas
router.post('/', authMiddleware, stockController.createComic);
router.put('/:stock_id', authMiddleware, stockController.updateStock);
router.patch('/:stock_id/adjust', authMiddleware, stockController.adjustStock);

// Si necesitas una ruta DELETE y el controlador no la tiene, agrégala al controlador primero
module.exports = router;
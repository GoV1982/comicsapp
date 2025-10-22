// backend/routes/stock.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAllStock,
  getStockByComicId,
  updateStock,
  adjustStock,
  getStockSummary
} = require('../controllers/stockController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getAllStock);
router.get('/summary', getStockSummary);
router.get('/comic/:comic_id', getStockByComicId);
router.put('/comic/:comic_id', updateStock);
router.post('/comic/:comic_id/adjust', adjustStock);

module.exports = router;
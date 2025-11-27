// backend/routes/googleSheets.js
const express = require('express');
const router = express.Router();
const {
    importFromSheets,
    exportToSheets,
    syncWithSheets
} = require('../controllers/googleSheetsController');
const { auth } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de Google Sheets
router.post('/comics/import', importFromSheets);
router.post('/comics/export', exportToSheets);
router.post('/comics/sync', syncWithSheets);

module.exports = router;

// backend/routes/editoriales.js
const express = require('express');
const router = express.Router();
const editorialesController = require('../controllers/editorialesController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', editorialesController.getAllEditoriales);
router.get('/:id', editorialesController.getEditorialById);

// Rutas protegidas
router.post('/', authMiddleware, editorialesController.createEditorial);
router.put('/:id', authMiddleware, editorialesController.updateEditorial);
router.delete('/:id', authMiddleware, editorialesController.deleteEditorial);

module.exports = router;
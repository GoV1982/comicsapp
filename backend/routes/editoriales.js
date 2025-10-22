// backend/routes/editoriales.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAllEditoriales,
  getEditorialById,
  createEditorial,
  updateEditorial,
  deleteEditorial
} = require('../controllers/editorialesController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getAllEditoriales);
router.get('/:id', getEditorialById);
router.post('/', createEditorial);
router.put('/:id', updateEditorial);
router.delete('/:id', deleteEditorial);

module.exports = router;
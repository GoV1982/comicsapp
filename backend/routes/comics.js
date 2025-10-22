// backend/routes/comics.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAllComics,
  getComicById,
  createComic,
  updateComic,
  deleteComic,
  getGeneros
} = require('../controllers/comicsController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getAllComics);
router.get('/generos/list', getGeneros);
router.get('/:id', getComicById);
router.post('/', createComic);
router.put('/:id', updateComic);
router.delete('/:id', deleteComic);

module.exports = router;
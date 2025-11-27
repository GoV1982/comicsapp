// backend/routes/comics.js
const express = require('express');
const router = express.Router();
const {
    getComics,
    createComic,
    getComicById,
    updateComic,
    deleteComic,
    deleteComicsByFilters,
    getGeneros
} = require('../controllers/comicsController');
const { auth } = require('../middleware/auth');

console.log('Funciones importadas:', {
    getComics: !!getComics,
    createComic: !!createComic,
    getComicById: !!getComicById,
    updateComic: !!updateComic,
    deleteComic: !!deleteComic,
    deleteComicsByFilters: !!deleteComicsByFilters,
    getGeneros: !!getGeneros
});

// Rutas públicas
router.get('/', getComics);
router.get('/generos', getGeneros);
router.get('/:id', getComicById);

// Rutas protegidas
router.post('/', auth, createComic);
router.put('/:id', auth, updateComic);
router.delete('/delete-by-filters', auth, deleteComicsByFilters);
router.delete('/:id', auth, deleteComic);

module.exports = router;

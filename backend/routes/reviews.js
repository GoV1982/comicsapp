const express = require('express');
const router = express.Router();
const { authCliente } = require('../middleware/authCliente');
const {
    addReview,
    getReviews,
    getSummary,
    getUserReview,
    deleteReview
} = require('../controllers/reviewsController');

// Rutas públicas
router.get('/:comicId', getReviews);
router.get('/summary/:comicId', getSummary);

// Rutas protegidas (requieren login de cliente)
router.post('/', authCliente, addReview);
router.get('/user/:comicId', authCliente, getUserReview);
router.delete('/:comicId', authCliente, deleteReview);

module.exports = router;

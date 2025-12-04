const Review = require('../models/Review');

const addReview = async (req, res) => {
    try {
        const { comicId, puntuacion, comentario } = req.body;
        const clienteId = req.cliente.id;

        if (!comicId || !puntuacion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (comicId, puntuacion)'
            });
        }

        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                success: false,
                message: 'La puntuación debe estar entre 1 y 5'
            });
        }

        const result = await Review.addReview(clienteId, comicId, puntuacion, comentario);

        res.json({
            success: true,
            data: result,
            message: result.updated ? 'Reseña actualizada' : 'Reseña creada'
        });
    } catch (error) {
        console.error('Error al agregar reseña:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const getReviews = async (req, res) => {
    try {
        const { comicId } = req.params;
        const reviews = await Review.getReviewsByComic(comicId);

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const getSummary = async (req, res) => {
    try {
        const { comicId } = req.params;
        const summary = await Review.getReviewSummary(comicId);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error al obtener resumen de reseñas:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const getUserReview = async (req, res) => {
    try {
        const { comicId } = req.params;
        const clienteId = req.cliente.id;

        const review = await Review.getUserReview(clienteId, comicId);

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Error al obtener reseña del usuario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { comicId } = req.params;
        const clienteId = req.cliente.id;

        await Review.deleteReview(clienteId, comicId);

        res.json({
            success: true,
            message: 'Reseña eliminada'
        });
    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

module.exports = {
    addReview,
    getReviews,
    getSummary,
    getUserReview,
    deleteReview
};

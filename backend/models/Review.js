const { runQuery, getAll, getOne } = require('../config/database');

class Review {
    static async addReview(clienteId, comicId, puntuacion, comentario) {
        try {
            // Check if review already exists
            const existing = await getOne(
                'SELECT id FROM reviews WHERE cliente_id = ? AND comic_id = ?',
                [clienteId, comicId]
            );

            if (existing) {
                // Update existing review
                await runQuery(
                    'UPDATE reviews SET puntuacion = ?, comentario = ?, fecha_creacion = CURRENT_TIMESTAMP WHERE id = ?',
                    [puntuacion, comentario, existing.id]
                );
                return { id: existing.id, updated: true };
            } else {
                // Create new review
                const result = await runQuery(
                    'INSERT INTO reviews (cliente_id, comic_id, puntuacion, comentario) VALUES (?, ?, ?, ?)',
                    [clienteId, comicId, puntuacion, comentario]
                );
                return { id: result.id, created: true };
            }
        } catch (error) {
            console.error('Error in Review.addReview:', error);
            throw error;
        }
    }

    static async getReviewsByComic(comicId) {
        try {
            return await getAll(
                `SELECT r.*, c.nombre as cliente_nombre 
         FROM reviews r 
         JOIN clientes c ON r.cliente_id = c.id 
         WHERE r.comic_id = ? 
         ORDER BY r.fecha_creacion DESC`,
                [comicId]
            );
        } catch (error) {
            console.error('Error in Review.getReviewsByComic:', error);
            throw error;
        }
    }

    static async getReviewSummary(comicId) {
        try {
            const result = await getOne(
                `SELECT 
           COUNT(*) as count, 
           AVG(puntuacion) as average 
         FROM reviews 
         WHERE comic_id = ?`,
                [comicId]
            );
            return {
                count: result.count || 0,
                average: result.average ? parseFloat(result.average.toFixed(1)) : 0
            };
        } catch (error) {
            console.error('Error in Review.getReviewSummary:', error);
            throw error;
        }
    }

    static async getUserReview(clienteId, comicId) {
        try {
            return await getOne(
                'SELECT * FROM reviews WHERE cliente_id = ? AND comic_id = ?',
                [clienteId, comicId]
            );
        } catch (error) {
            console.error('Error in Review.getUserReview:', error);
            throw error;
        }
    }

    static async deleteReview(clienteId, comicId) {
        try {
            await runQuery(
                'DELETE FROM reviews WHERE cliente_id = ? AND comic_id = ?',
                [clienteId, comicId]
            );
            return { success: true };
        } catch (error) {
            console.error('Error in Review.deleteReview:', error);
            throw error;
        }
    }
}

module.exports = Review;

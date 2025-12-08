const { getAll, getOne, runQuery, db } = require('../config/database');

// Obtener todas las tasas
const getAllTasas = async (req, res) => {
    try {
        const tasas = await getAll('SELECT * FROM tasas_cambio WHERE activo = 1 ORDER BY moneda');

        res.json({
            success: true,
            data: tasas,
        });
    } catch (error) {
        console.error('Error al obtener tasas:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Actualizar una tasa
const updateTasa = async (req, res) => {
    try {
        const { moneda } = req.params;
        const { tasa } = req.body;

        if (!tasa || tasa <= 0) {
            return res.status(400).json({
                error: 'Tasa inválida',
                message: 'La tasa debe ser mayor a 0',
            });
        }

        // No permitir cambiar la tasa de ARS (siempre es 1.0)
        if (moneda === 'ARS') {
            return res.status(400).json({
                error: 'No se puede modificar',
                message: 'La tasa de ARS siempre es 1.0 (moneda base)',
            });
        }

        await runQuery(
            'UPDATE tasas_cambio SET tasa = ?, updated_at = CURRENT_TIMESTAMP WHERE moneda = ?',
            [tasa, moneda]
        );

        res.json({
            success: true,
            message: 'Tasa actualizada correctamente',
        });
    } catch (error) {
        console.error('Error al actualizar tasa:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

// Obtener tasa de una moneda específica
const getTasaByMoneda = async (req, res) => {
    try {
        const { moneda } = req.params;

        const tasa = await getOne('SELECT * FROM tasas_cambio WHERE moneda = ?', [moneda]);

        if (!tasa) {
            return res.status(404).json({
                error: 'Moneda no encontrada',
                message: `No existe la moneda ${moneda}`,
            });
        }

        res.json({
            success: true,
            data: tasa,
        });
    } catch (error) {
        console.error('Error al obtener tasa:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message,
        });
    }
};

module.exports = {
    getAllTasas,
    updateTasa,
    getTasaByMoneda,
};

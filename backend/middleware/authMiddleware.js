const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Token no proporcionado'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar la información del usuario al request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = authMiddleware;
// backend/controllers/authController.js
const { getOne } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Login
const login = async (req, res) => {
    try {
        console.log('\n🔍 DEBUG LOGIN:');
        console.log('Headers:', req.headers);
        console.log('Body completo:', req.body);
        console.log('Content-Type:', req.headers['content-type']);

        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Datos faltantes:', {
                tieneUsername: !!username,
                tienePassword: !!password
            });
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Usuario y contraseña son requeridos'
            });
        }

        const query = 'SELECT * FROM usuarios WHERE username = ?';
        const user = await getOne(query, [username]);

        if (!user) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({
                error: 'Autenticación fallida',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({
                error: 'Autenticación fallida',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                nombre: user.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login exitoso');

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            error: 'Error en el servidor',
            message: error.message 
        });
    }
};

// Verificar token
const verifyToken = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message
        });
    }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
    try {
        const { getOne } = require('../config/database');
        const user = await getOne('SELECT id, username, nombre, email FROM usuarios WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message
        });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const { getOne } = require('../config/database');

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        const user = await getOne('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(400).json({
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual es incorrecta'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { runQuery } = require('../config/database');
        await runQuery('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message
        });
    }
};

// Exportación de funciones
module.exports = {
    login,
    verifyToken,
    getProfile,
    changePassword
};


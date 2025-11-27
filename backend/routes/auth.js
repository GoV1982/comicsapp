// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { login, verifyToken, getProfile, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Verificar que las funciones existan
if (!login) {
    throw new Error('La función login no está definida en authController');
}

// Rutas de autenticación
router.post('/login', login);
router.get('/verify', auth, verifyToken);
router.get('/profile', auth, getProfile);
router.post('/change-password', auth, changePassword);

module.exports = router;

// backend/routes/authCliente.js
const express = require('express');
const router = express.Router();
const { authCliente } = require('../middleware/authCliente');
const {
  register,
  verifyEmail,
  login,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyToken
} = require('../controllers/authClienteController');

// Rutas públicas (no requieren autenticación)
router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas (requieren autenticación)
router.get('/verify', authCliente, verifyToken);

module.exports = router;

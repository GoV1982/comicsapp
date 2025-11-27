// backend/routes/authClientes.js
const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  resendVerification,
  forgotPassword,
  resetPassword
} = require('../controllers/authClientesController');

// Rutas de autenticación para clientes
router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

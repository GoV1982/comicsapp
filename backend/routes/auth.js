// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  login,
  changePassword,
  getProfile,
  verifyTokenController
} = require('../controllers/authController');

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.post('/change-password', verifyToken, changePassword);
router.get('/profile', verifyToken, getProfile);
router.get('/verify', verifyToken, verifyTokenController);

module.exports = router;
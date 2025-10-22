// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, runQuery } = require('../config/database');
require('dotenv').config();

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Usuario y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = await getOne(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Actualizar último acceso
    await runQuery(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        nombre: user.nombre,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Responder con token y datos del usuario (sin contraseña)
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
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
    const userId = req.user.id;

    // Validar campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Validar longitud de nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener usuario
    const user = await getOne(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    );

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }

    // Hash de nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await runQuery(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getOne(
      'SELECT id, username, nombre, email, fecha_creacion, ultimo_acceso FROM usuarios WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado'
      });
    }

    res.json(user);

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      error: 'Error en el servidor',
      message: error.message 
    });
  }
};

// Verificar token (para validar sesión)
const verifyTokenController = (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      nombre: req.user.nombre
    }
  });
};

module.exports = {
  login,
  changePassword,
  getProfile,
  verifyTokenController
};
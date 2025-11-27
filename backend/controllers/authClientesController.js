// backend/controllers/authClientesController.js
const { getOne, runQuery } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Función helper para generar tokens de verificación
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Función helper para enviar email de verificación (placeholder)
const sendVerificationEmail = async (email, token) => {
  // TODO: Implementar envío real de email
  console.log(`📧 Email de verificación enviado a ${email} con token: ${token}`);
  // Aquí iría la integración con un servicio de email como SendGrid, Mailgun, etc.
};

// Registro de cliente
const register = async (req, res) => {
  try {
    const { nombre, email, password, whatsapp } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !whatsapp) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'El formato del email no es válido'
      });
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await getOne('SELECT id FROM clientes WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de verificación
    const verificationToken = generateVerificationToken();

    // Insertar nuevo cliente
    const result = await runQuery(
      `INSERT INTO clientes (nombre, email, password, whatsapp, email_verificado, token_verificacion, fecha_token_verificacion)
       VALUES (?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
      [nombre.trim(), email.trim(), hashedPassword, whatsapp.trim(), verificationToken]
    );

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      // No fallar el registro por error de email
    }

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente. Revisa tu email para verificar la cuenta.',
      data: {
        id: result.id,
        nombre: nombre.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim()
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Verificar email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Token requerido',
        message: 'El token de verificación es requerido'
      });
    }

    // Buscar cliente con el token
    const cliente = await getOne(
      'SELECT id, email FROM clientes WHERE token_verificacion = ? AND email_verificado = 0',
      [token]
    );

    if (!cliente) {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'El token de verificación no es válido o ya fue usado'
      });
    }

    // Verificar y actualizar
    await runQuery(
      'UPDATE clientes SET email_verificado = 1, token_verificacion = NULL, fecha_verificacion = CURRENT_TIMESTAMP WHERE id = ?',
      [cliente.id]
    );

    res.json({
      success: true,
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Login de cliente
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar cliente
    const cliente = await getOne('SELECT * FROM clientes WHERE email = ?', [email]);

    if (!cliente) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, cliente.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si el email está verificado
    if (!cliente.email_verificado) {
      return res.status(403).json({
        error: 'Email no verificado',
        message: 'Debes verificar tu email antes de iniciar sesión'
      });
    }

    // Actualizar último acceso
    await runQuery('UPDATE clientes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [cliente.id]);

    // Generar token JWT
    const token = jwt.sign(
      {
        id: cliente.id,
        email: cliente.email,
        nombre: cliente.nombre,
        tipo: 'cliente' // Para distinguir de admins
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Los clientes tienen sesión más larga
    );

    res.json({
      success: true,
      token,
      user: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        whatsapp: cliente.whatsapp,
        tipo: 'cliente'
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

// Reenviar email de verificación
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'El email es requerido'
      });
    }

    const cliente = await getOne(
      'SELECT id, nombre, token_verificacion FROM clientes WHERE email = ? AND email_verificado = 0',
      [email]
    );

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: 'No se encontró un cliente con este email pendiente de verificación'
      });
    }

    // Generar nuevo token si no tiene uno o es muy viejo
    let token = cliente.token_verificacion;
    if (!token) {
      token = generateVerificationToken();
      await runQuery(
        'UPDATE clientes SET token_verificacion = ?, fecha_token_verificacion = CURRENT_TIMESTAMP WHERE id = ?',
        [token, cliente.id]
      );
    }

    // Enviar email
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error('Error reenviando email de verificación:', emailError);
      return res.status(500).json({
        error: 'Error enviando email',
        message: 'No se pudo enviar el email de verificación'
      });
    }

    res.json({
      success: true,
      message: 'Email de verificación reenviado exitosamente'
    });

  } catch (error) {
    console.error('Error reenviando verificación:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Solicitar recuperación de contraseña
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'El email es requerido'
      });
    }

    const cliente = await getOne('SELECT id, nombre FROM clientes WHERE email = ?', [email]);

    if (!cliente) {
      // No revelar si el email existe o no por seguridad
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
      });
    }

    // Generar token de recuperación
    const resetToken = generateVerificationToken();

    // Guardar token (en un sistema real, esto debería expirar)
    await runQuery(
      'UPDATE clientes SET token_verificacion = ?, fecha_token_verificacion = CURRENT_TIMESTAMP WHERE id = ?',
      [resetToken, cliente.id]
    );

    // TODO: Enviar email con link de recuperación
    console.log(`🔑 Token de recuperación para ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Resetear contraseña
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const cliente = await getOne('SELECT id FROM clientes WHERE token_verificacion = ?', [token]);

    if (!cliente) {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'El token de recuperación no es válido'
      });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar token
    await runQuery(
      'UPDATE clientes SET password = ?, token_verificacion = NULL, fecha_token_verificacion = NULL WHERE id = ?',
      [hashedPassword, cliente.id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  resendVerification,
  forgotPassword,
  resetPassword
};

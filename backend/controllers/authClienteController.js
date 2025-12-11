// backend/controllers/authClienteController.js
const { runQuery, getOne } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Función helper para enviar emails (placeholder - implementar con servicio real)
const enviarEmail = async (destinatario, asunto, contenido) => {
  console.log(`📧 Email simulado enviado a ${destinatario}:`);
  console.log(`   Asunto: ${asunto}`);
  console.log(`   Contenido: ${contenido}`);
  // TODO: Implementar envío real de emails con nodemailer o similar
};

// Registro de cliente
const register = async (req, res) => {
  try {
    const { nombre, email, password, whatsapp } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const clienteExistente = await getOne('SELECT id FROM clientes WHERE email = ?', [email]);
    if (clienteExistente) {
      return res.status(400).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');

    // Crear cliente
    const result = await runQuery(
      `INSERT INTO clientes (nombre, email, password, whatsapp, token_verificacion, email_verificado)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [nombre, email, hashedPassword, whatsapp || null, tokenVerificacion]
    );

    // Crear configuración por defecto
    await runQuery(
      'INSERT INTO configuracion_cliente (cliente_id, notificaciones_email, notificaciones_similares, titulos_favoritos) VALUES (?, 1, 1, ?)',
      [result.id, JSON.stringify([])]
    );

    // Enviar email de verificación
    const linkVerificacion = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${tokenVerificacion}`;
    await enviarEmail(
      email,
      'Verifica tu cuenta - ComicsApp',
      `Hola ${nombre},\n\nBienvenido a ComicsApp. Para activar tu cuenta, haz clic en el siguiente enlace:\n\n${linkVerificacion}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`
    );

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente. Revisa tu email para verificar la cuenta.',
      cliente_id: result.id
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
        message: 'Se requiere un token de verificación'
      });
    }

    // Buscar cliente con el token
    const cliente = await getOne(
      'SELECT id, nombre, email FROM clientes WHERE token_verificacion = ? AND email_verificado = 0',
      [token]
    );

    if (!cliente) {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'El token de verificación es inválido o ya fue usado'
      });
    }

    // Verificar email
    await runQuery(
      'UPDATE clientes SET email_verificado = 1, token_verificacion = NULL, fecha_verificacion = CURRENT_TIMESTAMP WHERE id = ?',
      [cliente.id]
    );

    // Enviar email de bienvenida
    await enviarEmail(
      cliente.email,
      '¡Cuenta verificada! - ComicsApp',
      `¡Felicitaciones ${cliente.nombre}!\n\nTu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión y disfrutar de ComicsApp.`
    );

    res.json({
      success: true,
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('Error en verificación de email:', error);
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
    const cliente = await getOne(
      'SELECT id, nombre, email, password, email_verificado FROM clientes WHERE email = ?',
      [email]
    );

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

    // Verificar email verificado
    if (!cliente.email_verificado) {
      return res.status(403).json({
        error: 'Email no verificado',
        message: 'Debe verificar su email antes de iniciar sesión'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: cliente.id,
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Transferir carrito anónimo si se proporciona sessionId
    const { sessionId } = req.body;
    if (sessionId) {
      console.log('🔄 Intentando transferir carrito anónimo para sessionId:', sessionId);

      // Buscar carrito anónimo
      const carritoAnonimo = await getOne('SELECT id FROM carritos WHERE session_id = ?', [sessionId]);
      if (carritoAnonimo) {
        console.log('📦 Carrito anónimo encontrado, transfiriendo...');

        // Verificar si el cliente ya tiene carrito
        const carritoCliente = await getOne('SELECT id FROM carritos WHERE cliente_id = ?', [cliente.id]);

        if (carritoCliente) {
          // Transferir items del carrito anónimo al carrito del cliente
          // Primero, manejar items que ya existen (sumar cantidades)
          const itemsAnonimos = await getAll('SELECT comic_id, cantidad FROM carritos_items WHERE carrito_id = ?', [carritoAnonimo.id]);

          for (const item of itemsAnonimos) {
            const itemExistente = await getOne(
              'SELECT id, cantidad FROM carritos_items WHERE carrito_id = ? AND comic_id = ?',
              [carritoCliente.id, item.comic_id]
            );

            if (itemExistente) {
              // Actualizar cantidad existente
              await runQuery(
                'UPDATE carritos_items SET cantidad = cantidad + ? WHERE id = ?',
                [item.cantidad, itemExistente.id]
              );
            } else {
              // Insertar nuevo item
              await runQuery(
                'INSERT INTO carritos_items (carrito_id, comic_id, cantidad, precio_unitario) SELECT ?, comic_id, cantidad, precio_unitario FROM carritos_items WHERE id = ?',
                [carritoCliente.id, item.id]
              );
            }
          }

          // Eliminar carrito anónimo
          await runQuery('DELETE FROM carritos WHERE id = ?', [carritoAnonimo.id]);
          console.log('✅ Carrito anónimo transferido y eliminado');
        } else {
          // Asignar carrito anónimo al cliente
          await runQuery('UPDATE carritos SET cliente_id = ?, session_id = NULL WHERE id = ?', [cliente.id, carritoAnonimo.id]);
          console.log('✅ Carrito anónimo asignado al cliente');
        }
      } else {
        console.log('ℹ️ No se encontró carrito anónimo para transferir');
      }
    }

    // Actualizar último acceso
    await runQuery('UPDATE clientes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?', [cliente.id]);

    res.json({
      success: true,
      token,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email
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

// Reenviar verificación
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'Se requiere el email para reenviar la verificación'
      });
    }

    const cliente = await getOne(
      'SELECT id, nombre, token_verificacion FROM clientes WHERE email = ? AND email_verificado = 0',
      [email]
    );

    if (!cliente) {
      return res.status(404).json({
        error: 'Cliente no encontrado',
        message: 'No se encontró un cliente con ese email pendiente de verificación'
      });
    }

    // Generar nuevo token si no existe
    let token = cliente.token_verificacion;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await runQuery('UPDATE clientes SET token_verificacion = ? WHERE id = ?', [token, cliente.id]);
    }

    // Enviar email
    const linkVerificacion = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
    await enviarEmail(
      email,
      'Verifica tu cuenta - ComicsApp',
      `Hola ${cliente.nombre},\n\nPara activar tu cuenta, haz clic en el siguiente enlace:\n\n${linkVerificacion}`
    );

    res.json({
      success: true,
      message: 'Email de verificación reenviado exitosamente'
    });

  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Olvidé mi contraseña
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'Se requiere el email para restablecer la contraseña'
      });
    }

    const cliente = await getOne('SELECT id, nombre FROM clientes WHERE email = ?', [email]);
    if (!cliente) {
      // No revelar si el email existe o no por seguridad
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    await runQuery('UPDATE clientes SET token_verificacion = ? WHERE id = ?', [resetToken, cliente.id]);

    // Enviar email
    const linkReset = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    await enviarEmail(
      email,
      'Restablecer contraseña - ComicsApp',
      `Hola ${cliente.nombre},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n\n${linkReset}\n\nEste enlace expirará en 1 hora.`
    );

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Reset password
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

    const cliente = await getOne('SELECT id, nombre FROM clientes WHERE token_verificacion = ?', [token]);
    if (!cliente) {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'El token de restablecimiento es inválido o ha expirado'
      });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar token
    await runQuery(
      'UPDATE clientes SET password = ?, token_verificacion = NULL WHERE id = ?',
      [hashedPassword, cliente.id]
    );

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Verificar token
const verifyToken = async (req, res) => {
  try {
    // Si llega aquí, el middleware ya verificó el token
    res.json({
      success: true,
      message: 'Token válido',
      cliente: {
        id: req.cliente.id,
        email: req.cliente.email
      }
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
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
  resetPassword,
  verifyToken
};

const { getConfiguracionGlobal, updateConfiguracionGlobal } = require('../models/Configuracion');

// Obtener configuración global (solo admin)
const getGlobalConfig = async (req, res) => {
  try {
    const config = await getConfiguracionGlobal();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error al obtener configuración global:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      message: error.message,
      stack: error.stack
    });
  }
};

// Actualizar configuración global (solo admin)
const updateGlobalConfig = async (req, res) => {
  try {
    const {
      whatsapp_numero,
      tienda_nombre,
      email_contacto,
      moneda,
      zona_horaria,
      facebook_url,
      instagram_url,
      twitter_url,
      logo_url,
      descripcion_tienda,
      direccion,
      telefono,
      horario_atencion
    } = req.body;

    // Validar campos requeridos
    if (!tienda_nombre || !email_contacto) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'Nombre de tienda y email de contacto son requeridos'
      });
    }

    // Preparar updates
    const updates = {};

    // Campos de texto
    if (typeof whatsapp_numero === 'string') updates.whatsapp_numero = whatsapp_numero;
    if (typeof tienda_nombre === 'string') updates.tienda_nombre = tienda_nombre;
    if (typeof email_contacto === 'string') updates.email_contacto = email_contacto;
    if (typeof moneda === 'string') updates.moneda = moneda;
    if (typeof zona_horaria === 'string') updates.zona_horaria = zona_horaria;
    if (typeof facebook_url === 'string') updates.facebook_url = facebook_url;
    if (typeof instagram_url === 'string') updates.instagram_url = instagram_url;
    if (typeof twitter_url === 'string') updates.twitter_url = twitter_url;
    if (typeof logo_url === 'string') updates.logo_url = logo_url;
    if (typeof descripcion_tienda === 'string') updates.descripcion_tienda = descripcion_tienda;
    if (typeof direccion === 'string') updates.direccion = direccion;
    if (typeof telefono === 'string') updates.telefono = telefono;
    if (typeof horario_atencion === 'string') updates.horario_atencion = horario_atencion;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sin cambios',
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    const updatedConfig = await updateConfiguracionGlobal(updates);

    res.json({
      success: true,
      message: 'Configuración global actualizada exitosamente',
      data: updatedConfig
    });

  } catch (error) {
    console.error('Error al actualizar configuración global:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      message: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  getGlobalConfig,
  updateGlobalConfig
};

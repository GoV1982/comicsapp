const { runQuery, getAll, getOne } = require('../config/database');
const { findNewSimilarComics } = require('../utils/similarity');

// Función helper para enviar emails (reutilizar del auth controller)
const enviarEmail = async (destinatario, asunto, contenido) => {
  console.log(`📧 Email simulado enviado a ${destinatario}:`);
  console.log(`   Asunto: ${asunto}`);
  console.log(`   Contenido: ${contenido}`);
  // TODO: Implementar envío real de emails con nodemailer o similar
};

// Obtener notificaciones del usuario
const getNotificaciones = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    // Obtener notificaciones no eliminadas, ordenadas por fecha descendente
    const notificaciones = await getAll(`
      SELECT id, tipo, titulo, mensaje, leida, fecha_creacion, datos
      FROM notificaciones
      WHERE cliente_id = ? AND eliminada = 0
      ORDER BY fecha_creacion DESC
      LIMIT 50
    `, [clienteId]);

    // Parsear datos JSON si existen
    const notificacionesParsed = notificaciones.map(notif => ({
      ...notif,
      datos: notif.datos ? JSON.parse(notif.datos) : null
    }));

    res.json({
      success: true,
      notificaciones: notificacionesParsed
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Marcar notificación específica como leída
const marcarLeida = async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const clienteId = req.cliente.id;

    // Verificar que la notificación pertenece al usuario
    const notificacion = await getOne(
      'SELECT id FROM notificaciones WHERE id = ? AND cliente_id = ? AND eliminada = 0',
      [notificacionId, clienteId]
    );

    if (!notificacion) {
      return res.status(404).json({
        error: 'Notificación no encontrada',
        message: 'La notificación no existe o no pertenece a este usuario'
      });
    }

    // Marcar como leída
    await runQuery(
      'UPDATE notificaciones SET leida = 1 WHERE id = ?',
      [notificacionId]
    );

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Marcar todas las notificaciones como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    const clienteId = req.cliente.id;

    await runQuery(
      'UPDATE notificaciones SET leida = 1 WHERE cliente_id = ? AND eliminada = 0 AND leida = 0',
      [clienteId]
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones han sido marcadas como leídas'
    });

  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Eliminar notificación (soft delete)
const eliminarNotificacion = async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const clienteId = req.cliente.id;

    // Verificar que la notificación pertenece al usuario
    const notificacion = await getOne(
      'SELECT id FROM notificaciones WHERE id = ? AND cliente_id = ? AND eliminada = 0',
      [notificacionId, clienteId]
    );

    if (!notificacion) {
      return res.status(404).json({
        error: 'Notificación no encontrada',
        message: 'La notificación no existe o no pertenece a este usuario'
      });
    }

    // Soft delete
    await runQuery(
      'UPDATE notificaciones SET eliminada = 1 WHERE id = ?',
      [notificacionId]
    );

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Función para enviar notificaciones de nuevos cómics similares (llamada por cron job)
const enviarNotificacionesSimilares = async () => {
  try {
    console.log('🔍 Buscando nuevos cómics similares para notificaciones...');

    // Obtener todos los clientes con notificaciones habilitadas
    const clientes = await getAll(`
      SELECT c.id, c.nombre, c.email, conf.notificaciones_similares, conf.ultima_notificacion_similares
      FROM clientes c
      LEFT JOIN configuracion_cliente conf ON c.id = conf.cliente_id
      WHERE c.email_verificado = 1 AND (conf.notificaciones_similares IS NULL OR conf.notificaciones_similares = 1)
    `);

    // Obtener todos los cómics disponibles
    const allComics = await getAll(`
      SELECT c.id, c.titulo, c.genero, c.subgenero, c.editorial_id, c.fecha_creacion,
             e.nombre as editorial_nombre
      FROM comics c
      LEFT JOIN editoriales e ON c.editorial_id = e.id
      WHERE c.estado = 'Disponible'
    `);

    let totalNotificacionesEnviadas = 0;

    for (const cliente of clientes) {
      try {
        // Obtener favoritos del cliente
        const favoritosRaw = await getOne(
          'SELECT titulos_favoritos FROM configuracion_cliente WHERE cliente_id = ?',
          [cliente.id]
        );

        if (!favoritosRaw || !favoritosRaw.titulos_favoritos) continue;

        const favoritos = JSON.parse(favoritosRaw.titulos_favoritos);
        if (!Array.isArray(favoritos) || favoritos.length === 0) continue;

        // Determinar fecha de última notificación
        const ultimaNotificacion = cliente.ultima_notificacion_similares
          ? new Date(cliente.ultima_notificacion_similares)
          : new Date(0); // Si nunca se envió, buscar desde el inicio

        // Encontrar nuevos cómics similares
        const nuevosSimilares = findNewSimilarComics(favoritos, allComics, ultimaNotificacion, 0.3, 5);

        if (nuevosSimilares.length === 0) continue;

        // Crear notificaciones en BD
        const notificacionesCreadas = [];
        for (const similar of nuevosSimilares) {
          const comic = similar.comic;

          // Crear notificación
          const result = await runQuery(`
            INSERT INTO notificaciones (cliente_id, tipo, titulo, mensaje, datos, leida, eliminada, fecha_creacion)
            VALUES (?, 'nuevo_similar', '¡Nuevo cómic similar encontrado!', ?, ?, 0, 0, CURRENT_TIMESTAMP)
          `, [
            cliente.id,
            `Hemos encontrado "${comic.titulo}" que podría interesarte basado en tus favoritos.`,
            JSON.stringify({
              comic_id: comic.id,
              titulo: comic.titulo,
              editorial: comic.editorial_nombre,
              genero: comic.genero,
              subgenero: comic.subgenero,
              similarity: similar.similarity
            })
          ]);

          notificacionesCreadas.push(result.insertId);
        }

        // Enviar email si hay notificaciones
        if (notificacionesCreadas.length > 0) {
          const contenidoEmail = generarContenidoEmailSimilares(nuevosSimilares);
          await enviarEmail(
            cliente.email,
            'Nuevos cómics similares a tus favoritos - ComicsApp',
            contenidoEmail
          );

          totalNotificacionesEnviadas += notificacionesCreadas.length;
          console.log(`📧 Notificaciones enviadas a ${cliente.email}: ${notificacionesCreadas.length}`);
        }

        // Actualizar fecha de última notificación
        await runQuery(
          'UPDATE configuracion_cliente SET ultima_notificacion_similares = CURRENT_TIMESTAMP WHERE cliente_id = ?',
          [cliente.id]
        );

      } catch (clienteError) {
        console.error(`Error procesando notificaciones para cliente ${cliente.id}:`, clienteError);
      }
    }

    console.log(`✅ Proceso de notificaciones completado. Total enviadas: ${totalNotificacionesEnviadas}`);
    return { success: true, totalEnviadas: totalNotificacionesEnviadas };

  } catch (error) {
    console.error('Error en envío de notificaciones similares:', error);
    return { success: false, error: error.message };
  }
};

// Función helper para generar contenido de email
function generarContenidoEmailSimilares(similares) {
  let contenido = `Hola!\n\nHemos encontrado nuevos cómics que podrían interesarte basados en tus favoritos:\n\n`;

  similares.forEach((similar, index) => {
    const comic = similar.comic;
    contenido += `${index + 1}. "${comic.titulo}"\n`;
    contenido += `   Editorial: ${comic.editorial_nombre || 'N/A'}\n`;
    contenido += `   Género: ${comic.genero}${comic.subgenero ? ` (${comic.subgenero})` : ''}\n`;
    contenido += `   Similitud: ${Math.round(similar.similarity * 100)}%\n\n`;
  });

  contenido += `Visita ComicsApp para ver más detalles y agregar a tu carrito.\n\n`;
  contenido += `Puedes gestionar tus preferencias de notificaciones en tu perfil.\n\n`;
  contenido += `¡Feliz lectura!\n\nEl equipo de ComicsApp`;

  return contenido;
}

module.exports = {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  enviarNotificacionesSimilares
};

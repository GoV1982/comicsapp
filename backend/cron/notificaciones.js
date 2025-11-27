const cron = require('node-cron');
const { enviarNotificacionesSimilares } = require('../controllers/notificacionesController');

// Programar envío de notificaciones similares cada día a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Ejecutando tarea programada: envío de notificaciones similares');

  try {
    const resultado = await enviarNotificacionesSimilares();

    if (resultado.success) {
      console.log(`✅ Notificaciones enviadas exitosamente: ${resultado.totalEnviadas}`);
    } else {
      console.error('❌ Error en envío de notificaciones:', resultado.error);
    }
  } catch (error) {
    console.error('❌ Error en tarea programada de notificaciones:', error);
  }
}, {
  timezone: "America/Bogota" // Ajustar zona horaria según necesidad
});

console.log('📅 Tarea programada de notificaciones configurada: diariamente a las 9:00 AM');

module.exports = cron;

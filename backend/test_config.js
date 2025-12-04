const Configuracion = require('./models/Configuracion');
const { db } = require('./config/database');

async function testUpdate() {
    try {
        const clienteId = 46; // ID from previous logs
        const updates = {
            notificaciones_email: true,
            notificaciones_whatsapp: false,
            notificaciones_similares: true,
            mostrar_favoritos: true,
            privacidad_perfil: 'publico'
        };

        console.log('Testing updateConfiguracion...');
        const result = await Configuracion.updateConfiguracion(clienteId, updates);
        console.log('Success:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUpdate();

// Script para ver qué devuelve el endpoint de catálogo
const axios = require('axios');

console.log('\n🔍 Verificando endpoint /api/public/catalogo...\n');

axios.get('http://localhost:3002/api/public/catalogo')
    .then(response => {
        const comics = response.data.data || [];

        console.log(`📊 Total de comics: ${comics.length}\n`);

        // Agrupar por estado
        const porEstado = {};
        comics.forEach(comic => {
            const estado = comic.estado || 'Sin estado';
            porEstado[estado] = (porEstado[estado] || 0) + 1;
        });

        console.log('📈 Comics por estado:');
        Object.entries(porEstado).forEach(([estado, cantidad]) => {
            console.log(`   ${estado}: ${cantidad}`);
        });

        // Buscar los que incluyen "novedad"
        const conNovedad = comics.filter(c => {
            const estado = c.estado || '';
            return estado.toLowerCase().includes('novedad');
        });

        console.log(`\n✅ Comics con "novedad" en el estado: ${conNovedad.length}`);

        if (conNovedad.length > 0) {
            console.log('\n📋 Primeros 5 comics con novedad:');
            conNovedad.slice(0, 5).forEach((comic, i) => {
                console.log(`   ${i + 1}. ${comic.titulo} - Estado: "${comic.estado}"`);
            });
        } else {
            console.log('\n⚠️  No hay comics con "novedad" en el estado');
            console.log('\n📋 Primeros 5 comics para referencia:');
            comics.slice(0, 5).forEach((comic, i) => {
                console.log(`   ${i + 1}. ${comic.titulo} - Estado: "${comic.estado || 'Sin estado'}"`);
            });
        }
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    });

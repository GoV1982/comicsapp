// Script para probar el endpoint de summary
const axios = require('axios');

console.log('\n🔍 Probando endpoint /api/stock/summary...\n');

axios.get('http://localhost:3002/api/stock/summary')
    .then(response => {
        console.log('✅ Respuesta del servidor:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n📊 Valores específicos:');
        console.log(`   Total Items: ${response.data.data.total_items}`);
        console.log(`   Total Unidades: ${response.data.data.total_unidades}`);
        console.log(`   Sin Stock: ${response.data.data.sin_stock}`);
        console.log(`   Bajo Stock: ${response.data.data.bajo_stock}`);

        // Verificar tipos
        console.log('\n🔍 Tipos de datos:');
        console.log(`   total_unidades es type: ${typeof response.data.data.total_unidades}`);
        console.log(`   total_unidades valor: ${response.data.data.total_unidades}`);
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    });

const { runQuery, getOne } = require('./config/database');

async function testDeleteComic(comicId) {
    try {
        console.log(`\nIntentando eliminar comic ID: ${comicId}`);

        // Verificar que el comic existe
        const comic = await getOne('SELECT id, titulo FROM comics WHERE id = ?', [comicId]);
        if (!comic) {
            console.log('Comic no encontrado');
            return;
        }
        console.log('Comic encontrado:', comic.titulo);

        // Eliminar el comic de todos los carritos
        console.log('Eliminando de carritos_items...');
        const result1 = await runQuery('DELETE FROM carritos_items WHERE comic_id = ?', [comicId]);
        console.log('Resultado:', result1);

        // Eliminar las reservas asociadas al comic
        console.log('Eliminando reservas...');
        const result2 = await runQuery('DELETE FROM reservas WHERE comic_id = ?', [comicId]);
        console.log('Resultado:', result2);

        // Eliminar el comic
        console.log('Eliminando comic...');
        const result3 = await runQuery('DELETE FROM comics WHERE id = ?', [comicId]);
        console.log('Resultado:', result3);

        console.log('✅ Comic eliminado exitosamente');
    } catch (error) {
        console.error('❌ Error al eliminar comic:');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
    }
    process.exit(0);
}

// Usar el ID del comic que está dando error
testDeleteComic(7283);

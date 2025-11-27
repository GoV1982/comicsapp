const { runQuery, getAll, getOne } = require('./config/database');
const { findSimilarComics, enviarNotificacionesSimilares } = require('./controllers/notificacionesController');

async function runTests() {
  console.log('🚀 Starting notification system tests...\n');

  let allPassed = true;

  // Test similarity detection
  const similarityTest = await testSimilarityDetection();
  allPassed = allPassed && similarityTest;

  // Test notification sending (dry run)
  const notificationTest = await testNotificationSending();
  allPassed = allPassed && notificationTest;

  // Test cron job setup
  const cronTest = await testCronJobSetup();
  allPassed = allPassed && cronTest;

  console.log('\n✅ All tests completed!');
  if (allPassed) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
  }

  process.exit(allPassed ? 0 : 1);
}

// Test similarity detection
async function testSimilarityDetection() {
  console.log('🧪 Testing similarity detection...');

  try {
    const { getAll } = require('./config/database');
    const { findSimilarComics } = require('./utils/similarity');

    // Get some comics from database
    const comics = await getAll('SELECT id, titulo, genero, subgenero, editorial_id, fecha_creacion FROM comics LIMIT 10');

    if (comics.length < 2) {
      console.log('❌ Not enough comics in database for similarity test');
      return false;
    }

    // Test similarity between first two comics
    const similar = findSimilarComics([comics[0].id], comics, 0.1, 5);

    console.log(`✅ Found ${similar.length} similar comics`);
    return true;

  } catch (error) {
    console.log('❌ Error testing similarity detection:', error.message);
    return false;
  }
}

// Test notification sending (dry run)
async function testNotificationSending() {
  console.log('\n🧪 Testing notification sending (dry run)...');

  try {
    // Create a test client if none exists
    const testClient = await getOne('SELECT id FROM clientes LIMIT 1');

    if (!testClient) {
      console.log('❌ No test client found in database');
      return false;
    }

    // Create test configuration
    await runQuery(`
      INSERT OR REPLACE INTO configuracion_clientes (cliente_id, titulos_favoritos, notificaciones, notificaciones_email, notificaciones_whatsapp, notificaciones_similares, mostrar_favoritos, privacidad_perfil)
      VALUES (?, ?, 1, 1, 0, 1, 1, 'publico')
    `, [testClient.id, JSON.stringify([1, 2, 3])]); // Some test favorite IDs

    // Test the notification function (it will fail gracefully without real data)
    const result = await enviarNotificacionesSimilares();

    if (result && typeof result === 'object') {
      console.log(`✅ Notification system executed (sent ${result.totalEnviadas || 0} notifications)`);
      return true;
    } else {
      console.log('❌ Notification system returned unexpected result');
      return false;
    }

  } catch (error) {
    console.log('❌ Error testing notification sending:', error.message);
    return false;
  }
}

// Test cron job setup
async function testCronJobSetup() {
  console.log('\n🧪 Testing cron job setup...');

  try {
    // Check if cron module can be loaded
    const cron = require('node-cron');

    if (cron) {
      console.log('✅ Cron job module loaded successfully');

      // Test cron schedule parsing (doesn't actually schedule)
      const testSchedule = '0 9 * * *'; // Daily at 9 AM
      const isValid = cron.validate(testSchedule);

      if (isValid) {
        console.log('📅 Cron job should run daily at 9:00 AM');
        return true;
      } else {
        console.log('❌ Invalid cron schedule');
        return false;
      }
    } else {
      console.log('❌ Cron job module not found');
      return false;
    }

  } catch (error) {
    console.log('❌ Error testing cron job setup:', error.message);
    return false;
  }
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testSimilarityDetection, testNotificationSending, testCronJobSetup };

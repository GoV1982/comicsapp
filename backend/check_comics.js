const { getAll } = require('./config/database');

async function checkComics() {
  try {
    const comics = await getAll('SELECT id, titulo FROM comics LIMIT 5');
    console.log('Comics in database:');
    console.log(JSON.stringify(comics, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkComics();

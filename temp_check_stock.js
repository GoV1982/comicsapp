const { getAll } = require('./backend/config/database');

async function checkStock() {
  try {
    const stocks = await getAll('SELECT comic_id, cantidad_disponible FROM stock');
    console.log('Stock entries:');
    stocks.forEach(stock => {
      console.log(`Comic ID: ${stock.comic_id}, Cantidad: ${stock.cantidad_disponible}`);
    });

    const total = stocks.reduce((sum, stock) => sum + stock.cantidad_disponible, 0);
    console.log(`Total unidades calculadas: ${total}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStock();

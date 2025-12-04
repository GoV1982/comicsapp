const db = require('./config/database').db;

try {
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='configuracion_cliente'").get();
    console.log('Schema for configuracion_cliente:');
    console.log(schema.sql);
} catch (error) {
    console.error('Error getting schema:', error);
}

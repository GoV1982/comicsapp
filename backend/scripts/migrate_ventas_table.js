const { db } = require('../config/database');

const migrateVentasTable = () => {
    console.log('Iniciando migración de tabla ventas...');

    try {
        // Verificar si la columna 'estado' existe
        const columns = db.prepare("PRAGMA table_info(ventas)").all();
        const hasEstado = columns.some(col => col.name === 'estado');

        if (!hasEstado) {
            console.log("Agregando columna 'estado' a la tabla ventas...");
            db.prepare("ALTER TABLE ventas ADD COLUMN estado TEXT DEFAULT 'completada'").run();
            console.log("Columna 'estado' agregada correctamente.");
        } else {
            console.log("La columna 'estado' ya existe.");
        }
    } catch (error) {
        console.error('Error durante la migración:', error);
    }
};

migrateVentasTable();

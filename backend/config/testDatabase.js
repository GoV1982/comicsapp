const { runQuery } = require('./database');

const testTable = async () => {
    try {
        // Intentar insertar un usuario de prueba
        await runQuery(`
            INSERT INTO usuarios (username, email, password, nombre)
            VALUES ('test', 'test@test.com', 'hashedpassword', 'Usuario Test')
        `);
        
        // Verificar si se insertó
        const user = await runQuery('SELECT * FROM usuarios WHERE username = ?', ['test']);
        console.log('Usuario de prueba:', user);
        
    } catch (error) {
        console.error('Error en prueba:', error);
    }
};

testTable();
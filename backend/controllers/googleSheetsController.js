const { google } = require('googleapis');
const { getAll, runQuery, getOne } = require('../config/database');

// Configuración de Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID';

// Función para autenticar con Google
async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './service-account-key.json',
        scopes: SCOPES,
    });
    return auth;
}

// Función para obtener datos de Google Sheets
async function getSheetData(range) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        return response.data.values || [];
    } catch (error) {
        console.error('Error al obtener datos de Google Sheets:', error);
        throw error;
    }
}

// Función para escribir datos en Google Sheets
async function updateSheetData(range, values) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const resource = {
            values: values,
        };

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource,
        });

        return response.data;
    } catch (error) {
        console.error('Error al actualizar Google Sheets:', error);
        throw error;
    }
}

// Función para agregar datos a Google Sheets
async function appendSheetData(range, values) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const resource = {
            values: values,
        };

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource,
        });

        return response.data;
    } catch (error) {
        console.error('Error al agregar datos a Google Sheets:', error);
        throw error;
    }
}

// Función para limpiar una hoja
async function clearSheet(range) {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        return response.data;
    } catch (error) {
        console.error('Error al limpiar Google Sheets:', error);
        throw error;
    }
}

// Función para importar comics desde Google Sheets
const importFromSheets = async (req, res) => {
    try {
        const { sheetName = 'Comics', replaceExisting = false } = req.body;
        const range = `${sheetName}!A2:J`; // Columnas: A-I (datos), J (stock)

        console.log(`📥 Iniciando importación desde "${sheetName}"...`);
        const rows = await getSheetData(range);

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se encontraron datos en la hoja de cálculo'
            });
        }

        const imported = [];
        const skipped = [];
        const errors = [];

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 5) continue; // Saltar filas incompletas

            try {
                // Mapear columnas: Título, Número Edición, Editorial, Precio, Género, Subgénero, Imagen URL, Descripción, Estado, Stock
                const [titulo, numero_edicion, editorial_nombre, precio, genero, subgenero, imagen_url, descripcion, estado, stock] = row;

                if (!titulo || !numero_edicion || !editorial_nombre || !precio || !genero) {
                    errors.push({ row: i + 2, message: 'Campos requeridos faltantes' });
                    continue;
                }

                // Buscar o crear editorial
                let editorialQuery = 'SELECT id FROM editoriales WHERE nombre = ?';
                let editorial = await getOne(editorialQuery, [editorial_nombre]);

                let editorial_id;
                if (!editorial) {
                    // Crear nueva editorial
                    const insertEditorialQuery = 'INSERT INTO editoriales (nombre) VALUES (?)';
                    const editorialResult = await runQuery(insertEditorialQuery, [editorial_nombre]);
                    editorial_id = editorialResult.id;
                    console.log(`✨ Nueva editorial creada: ${editorial_nombre} (ID: ${editorial_id})`);
                } else {
                    editorial_id = editorial.id;
                }

                // Verificar si el comic ya existe (duplicado)
                const duplicateQuery = `
                    SELECT c.id, c.titulo, c.numero_edicion, e.nombre as editorial_nombre
                    FROM comics c
                    LEFT JOIN editoriales e ON c.editorial_id = e.id
                    WHERE LOWER(c.titulo) = LOWER(?)
                    AND LOWER(c.numero_edicion) = LOWER(?)
                    AND LOWER(e.nombre) = LOWER(?)
                `;
                const existingComic = await getOne(duplicateQuery, [titulo.trim(), numero_edicion.trim(), editorial_nombre.trim()]);

                if (existingComic) {
                    if (replaceExisting) {
                        // Actualizar comic existente
                        const updateComicQuery = `
                            UPDATE comics
                            SET editorial_id = ?, precio = ?, genero = ?, subgenero = ?, imagen_url = ?, descripcion = ?, estado = ?
                            WHERE id = ?
                        `;
                        await runQuery(updateComicQuery, [
                            editorial_id,
                            parseFloat(precio),
                            genero,
                            subgenero || null,
                            imagen_url || null,
                            descripcion || null,
                            estado || 'Disponible',
                            existingComic.id
                        ]);

                        // Actualizar stock (si existe la columna)
                        if (stock !== undefined && stock !== null && stock !== '') {
                            const stockValue = parseInt(stock) || 0;
                            const existingStock = await getOne('SELECT id FROM stock WHERE comic_id = ?', [existingComic.id]);

                            if (existingStock) {
                                await runQuery('UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?', [stockValue, existingComic.id]);
                            } else {
                                await runQuery('INSERT INTO stock (comic_id, cantidad_disponible) VALUES (?, ?)', [existingComic.id, stockValue]);
                            }
                            console.log(`📦 Stock actualizado: ${titulo} - ${stockValue} unidades`);
                        }

                        imported.push({
                            id: existingComic.id,
                            titulo,
                            numero_edicion,
                            editorial_nombre,
                            action: 'updated'
                        });
                    } else {
                        // Saltar duplicado
                        skipped.push({
                            titulo,
                            numero_edicion,
                            editorial_nombre,
                            reason: 'duplicate'
                        });
                    }
                    continue;
                }

                // Insertar nuevo comic
                const insertComicQuery = `
                    INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const comicResult = await runQuery(insertComicQuery, [
                    titulo.trim(),
                    numero_edicion.trim(),
                    editorial_id,
                    parseFloat(precio),
                    genero,
                    subgenero || null,
                    imagen_url || null,
                    descripcion || null,
                    estado || 'Disponible'
                ]);

                const newComicId = comicResult.id;

                // Insertar stock (el trigger debería crearlo, pero lo hacemos explícito)
                const stockValue = (stock !== undefined && stock !== null && stock !== '') ? parseInt(stock) : 0;

                // Verificar si el trigger ya creó el stock
                const existingStock = await getOne('SELECT id FROM stock WHERE comic_id = ?', [newComicId]);

                if (existingStock) {
                    // Actualizar el stock creado por el trigger
                    await runQuery('UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?', [stockValue, newComicId]);
                } else {
                    // Crear stock si el trigger no lo hizo
                    await runQuery('INSERT INTO stock (comic_id, cantidad_disponible) VALUES (?, ?)', [newComicId, stockValue]);
                }

                console.log(`✅ Nuevo cómic importado: ${titulo} (${numero_edicion}) - Stock: ${stockValue}`);

                imported.push({
                    id: newComicId,
                    titulo,
                    numero_edicion,
                    editorial_nombre,
                    stock: stockValue,
                    action: 'created'
                });

            } catch (error) {
                console.error(`❌ Error en fila ${i + 2}:`, error.message);
                errors.push({ row: i + 2, message: error.message });
            }
        }

        console.log(`📊 Importación finalizada: ${imported.length} procesados, ${skipped.length} saltados, ${errors.length} errores`);

        res.json({
            success: true,
            message: `Importación completada. ${imported.length} comics procesados, ${skipped.length} saltados, ${errors.length} errores.`,
            imported,
            skipped,
            errors
        });

    } catch (error) {
        console.error('❌ Error en importación:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la importación',
            error: error.message
        });
    }
};

// Función para exportar comics a Google Sheets
const exportToSheets = async (req, res) => {
    try {
        const { sheetName, comics: filteredComics, mode = 'replace' } = req.body;
        // Modos: 'replace' (default), 'append', 'update'

        // Validar que sheetName sea un string
        if (!sheetName || typeof sheetName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'sheetName debe ser un string válido'
            });
        }

        let comics;

        if (filteredComics && Array.isArray(filteredComics) && filteredComics.length > 0) {
            // Obtener datos completos incluyendo stock de los comics filtrados
            const comicIds = filteredComics.map(c => c.id).join(',');
            const query = `
                SELECT c.*, e.nombre as editorial_nombre, s.cantidad_disponible as stock
                FROM comics c
                LEFT JOIN editoriales e ON c.editorial_id = e.id
                LEFT JOIN stock s ON c.id = s.comic_id
                WHERE c.id IN (${comicIds})
                ORDER BY c.id
            `;
            comics = await getAll(query);
        } else {
            // Obtener todos los comics si no se enviaron filtrados
            const query = `
                SELECT c.*, e.nombre as editorial_nombre, s.cantidad_disponible as stock
                FROM comics c
                LEFT JOIN editoriales e ON c.editorial_id = e.id
                LEFT JOIN stock s ON c.id = s.comic_id
                ORDER BY c.id
            `;
            comics = await getAll(query);
        }

        if (comics.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay comics para exportar'
            });
        }

        console.log(`📤 Exportando ${comics.length} comics a "${sheetName}" (modo: ${mode})...`);

        // Preparar datos para Google Sheets
        const headers = [['Título', 'Número Edición', 'Editorial', 'Precio', 'Género', 'Subgénero', 'Imagen URL', 'Descripción', 'Estado', 'Stock']];
        const data = comics.map(comic => [
            comic.titulo,
            comic.numero_edicion,
            comic.editorial_nombre || comic.editorial,
            comic.precio,
            comic.genero,
            comic.subgenero || '',
            comic.imagen_url || '',
            comic.descripcion || '',
            comic.estado || 'Disponible',
            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
        ]);

        if (mode === 'replace') {
            // Modo REPLACE: Limpiar todo y escribir nuevos datos
            const values = [...headers, ...data];
            const range = `${sheetName}!A1:J${values.length}`;

            await clearSheet(`${sheetName}!A1:Z1000`); // Limpiar un rango amplio
            await updateSheetData(range, values);

            console.log(`✅ ${comics.length} comics exportados (modo REPLACE)`);

        } else if (mode === 'append') {
            // Modo APPEND: Agregar al final (sin headers si ya existen)
            // Verificar si hay datos en la hoja
            const existingData = await getSheetData(`${sheetName}!A1:A`);
            const hasHeaders = existingData.length > 0;

            if (!hasHeaders) {
                // Si no hay headers, agregarlos primero
                await appendSheetData(`${sheetName}!A1`, headers);
            }

            // Agregar los nuevos datos
            await appendSheetData(`${sheetName}!A:J`, data);

            console.log(`✅ ${comics.length} comics agregados al final (modo APPEND)`);

        } else if (mode === 'update') {
            // Modo UPDATE: Actualizar registros existentes que coincidan
            // Este modo lee la hoja, busca coincidencias, y actualiza solo esas filas
            const existingRows = await getSheetData(`${sheetName}!A2:J`);

            if (existingRows.length === 0) {
                // Si no hay datos, hacer un replace inicial
                const values = [...headers, ...data];
                await clearSheet(`${sheetName}!A1:Z1000`);
                await updateSheetData(`${sheetName}!A1:J${values.length}`, values);
                console.log(`✅ ${comics.length} comics exportados (modo UPDATE - primera vez)`);
            } else {
                let updatedCount = 0;
                let addedCount = 0;

                // Crear un mapa de los comics existentes en Sheets
                const existingMap = new Map();
                existingRows.forEach((row, index) => {
                    if (row.length >= 3) {
                        const key = `${row[0]}_${row[1]}_${row[2]}`.toLowerCase(); // titulo_numero_editorial
                        existingMap.set(key, index + 2); // +2 porque empezamos en A2
                    }
                });

                // Actualizar los cómics que existen y agregar los nuevos
                const rowsToAppend = [];

                for (const comic of comics) {
                    const key = `${comic.titulo}_${comic.numero_edicion}_${comic.editorial_nombre}`.toLowerCase();
                    const existingRowIndex = existingMap.get(key);

                    if (existingRowIndex) {
                        // Actualizar fila existente
                        const rowData = [[
                            comic.titulo,
                            comic.numero_edicion,
                            comic.editorial_nombre || comic.editorial,
                            comic.precio,
                            comic.genero,
                            comic.subgenero || '',
                            comic.imagen_url || '',
                            comic.descripcion || '',
                            comic.estado || 'Disponible',
                            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
                        ]];
                        await updateSheetData(`${sheetName}!A${existingRowIndex}:J${existingRowIndex}`, rowData);
                        updatedCount++;
                    } else {
                        // Agregar al final
                        rowsToAppend.push([
                            comic.titulo,
                            comic.numero_edicion,
                            comic.editorial_nombre || comic.editorial,
                            comic.precio,
                            comic.genero,
                            comic.subgenero || '',
                            comic.imagen_url || '',
                            comic.descripcion || '',
                            comic.estado || 'Disponible',
                            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
                        ]);
                        addedCount++;
                    }
                }

                // Agregar nuevos registros si los hay
                if (rowsToAppend.length > 0) {
                    await appendSheetData(`${sheetName}!A:J`, rowsToAppend);
                }

                console.log(`✅ Modo UPDATE: ${updatedCount} actualizados, ${addedCount} agregados`);
            }

        } else {
            return res.status(400).json({
                success: false,
                message: 'Modo de exportación inválido. Use "replace", "append" o "update"'
            });
        }

        res.json({
            success: true,
            message: mode === 'update'
                ? `Comics exportados exitosamente en modo ${mode.toUpperCase()}`
                : `${comics.length} comics exportados exitosamente a Google Sheets (modo ${mode.toUpperCase()})`,
            exported: comics.length,
            mode
        });

    } catch (error) {
        console.error('❌ Error en exportación:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la exportación',
            error: error.message
        });
    }
};

// Función para sincronizar (backup completo)
const syncWithSheets = async (req, res) => {
    try {
        const {
            strategy = 'db-to-sheets',  // 'sheets-to-db', 'db-to-sheets', 'two-way-smart'
            sheetName = 'Comics',
            replaceOnConflict = true    // Para conflictos en two-way-smart
        } = req.body;

        console.log(`🔄 Iniciando sincronización (estrategia: ${strategy})...`);

        const results = {
            strategy,
            import: null,
            export: null,
            timestamp: new Date().toISOString()
        };

        if (strategy === 'sheets-to-db') {
            // ESTRATEGIA 1: Solo importar desde Sheets a BD
            console.log('📥 Sincronizando: Sheets → Base de datos');
            const importResult = await importFromSheetsInternal(sheetName, true); // Con validación de duplicados
            results.import = importResult;
            results.message = `Importados: ${importResult.imported}, Actualizados: ${importResult.updated}, Errores: ${importResult.errors}`;

        } else if (strategy === 'db-to-sheets') {
            // ESTRATEGIA 2: Solo exportar desde BD a Sheets
            console.log('📤 Sincronizando: Base de datos → Sheets');
            const exportResult = await exportToSheetsInternal(sheetName, 'replace');
            results.export = exportResult;
            results.message = `${exportResult.exported} comics exportados a Google Sheets`;

        } else if (strategy === 'two-way-smart') {
            // ESTRATEGIA 3: Sincronización bidireccional inteligente
            console.log('🔄 Sincronización bidireccional inteligente');

            // Paso 1: Importar desde Sheets (actualiza BD con cambios de Sheets)
            console.log('  Paso 1/2: Importando cambios desde Sheets...');
            const importResult = await importFromSheetsInternal(sheetName, replaceOnConflict);
            results.import = importResult;

            // Paso 2: Exportar a Sheets en modo UPDATE (actualiza Sheets con nuevos de BD)
            console.log('  Paso 2/2: Exportando cambios a Sheets...');
            const exportResult = await exportToSheetsInternal(sheetName, 'update');
            results.export = exportResult;

            results.message = `Sincronización bidireccional completada. Import: ${importResult.imported} nuevos, ${importResult.updated} actualizados. Export: actualizados según necesidad.`;

        } else {
            return res.status(400).json({
                success: false,
                message: 'Estrategia inválida. Use: "sheets-to-db", "db-to-sheets", o "two-way-smart"'
            });
        }

        console.log(`✅ Sincronización completada: ${results.message}`);

        res.json({
            success: true,
            message: 'Sincronización completada',
            results
        });

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la sincronización',
            error: error.message
        });
    }
};

// Funciones internas para reutilización (MEJORADAS)
async function importFromSheetsInternal(sheetName = 'Comics', validateDuplicates = true) {
    try {
        const range = `${sheetName}!A2:J`;
        const rows = await getSheetData(range);

        if (rows.length === 0) {
            return { imported: 0, updated: 0, skipped: 0, errors: 0, message: 'No hay datos para importar' };
        }

        let imported = 0;
        let updated = 0;
        let skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 5) {
                skipped++;
                continue;
            }

            try {
                const [titulo, numero_edicion, editorial_nombre, precio, genero, subgenero, imagen_url, descripcion, estado, stock] = row;

                if (!titulo || !numero_edicion || !editorial_nombre || !precio || !genero) {
                    errors.push({ row: i + 2, message: 'Campos requeridos faltantes' });
                    continue;
                }

                // Buscar o crear editorial
                let editorial = await getOne('SELECT id FROM editoriales WHERE nombre = ?', [editorial_nombre]);
                let editorial_id;

                if (!editorial) {
                    const editorialResult = await runQuery('INSERT INTO editoriales (nombre) VALUES (?)', [editorial_nombre]);
                    editorial_id = editorialResult.id;
                } else {
                    editorial_id = editorial.id;
                }

                if (validateDuplicates) {
                    // Validar duplicados
                    const duplicateQuery = `
                        SELECT c.id
                        FROM comics c
                        LEFT JOIN editoriales e ON c.editorial_id = e.id
                        WHERE LOWER(c.titulo) = LOWER(?)
                        AND LOWER(c.numero_edicion) = LOWER(?)
                        AND LOWER(e.nombre) = LOWER(?)
                    `;
                    const existingComic = await getOne(duplicateQuery, [titulo.trim(), numero_edicion.trim(), editorial_nombre.trim()]);

                    if (existingComic) {
                        // Actualizar comic existente
                        await runQuery(`
                            UPDATE comics
                            SET editorial_id = ?, precio = ?, genero = ?, subgenero = ?, imagen_url = ?, descripcion = ?, estado = ?
                            WHERE id = ?
                        `, [editorial_id, parseFloat(precio), genero, subgenero || null, imagen_url || null, descripcion || null, estado || 'Disponible', existingComic.id]);

                        // Actualizar stock
                        if (stock !== undefined && stock !== null && stock !== '') {
                            const stockValue = parseInt(stock) || 0;
                            const existingStock = await getOne('SELECT id FROM stock WHERE comic_id = ?', [existingComic.id]);

                            if (existingStock) {
                                await runQuery('UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?', [stockValue, existingComic.id]);
                            } else {
                                await runQuery('INSERT INTO stock (comic_id, cantidad_disponible) VALUES (?, ?)', [existingComic.id, stockValue]);
                            }
                        }

                        updated++;
                        continue;
                    }
                }

                // Insertar nuevo comic
                const comicResult = await runQuery(`
                    INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [titulo.trim(), numero_edicion.trim(), editorial_id, parseFloat(precio), genero, subgenero || null, imagen_url || null, descripcion || null, estado || 'Disponible']);

                const newComicId = comicResult.id;

                // Insertar/actualizar stock
                const stockValue = (stock !== undefined && stock !== null && stock !== '') ? parseInt(stock) : 0;
                const existingStock = await getOne('SELECT id FROM stock WHERE comic_id = ?', [newComicId]);

                if (existingStock) {
                    await runQuery('UPDATE stock SET cantidad_disponible = ? WHERE comic_id = ?', [stockValue, newComicId]);
                } else {
                    await runQuery('INSERT INTO stock (comic_id, cantidad_disponible) VALUES (?, ?)', [newComicId, stockValue]);
                }

                imported++;

            } catch (error) {
                errors.push({ row: i + 2, message: error.message });
            }
        }

        return {
            imported,
            updated,
            skipped,
            errors: errors.length,
            errorDetails: errors,
            message: `${imported} importados, ${updated} actualizados, ${skipped} saltados, ${errors.length} errores`
        };
    } catch (error) {
        console.error('Error en importFromSheetsInternal:', error);
        throw error;
    }
}

async function exportToSheetsInternal(sheetName = 'Comics', mode = 'replace') {
    try {
        const query = `
            SELECT c.*, e.nombre as editorial_nombre, s.cantidad_disponible as stock
            FROM comics c
            LEFT JOIN editoriales e ON c.editorial_id = e.id
            LEFT JOIN stock s ON c.id = s.comic_id
            ORDER BY c.id
        `;
        const comics = await getAll(query);

        if (comics.length === 0) {
            return { exported: 0, message: 'No hay comics para exportar' };
        }

        const headers = [['Título', 'Número Edición', 'Editorial', 'Precio', 'Género', 'Subgénero', 'Imagen URL', 'Descripción', 'Estado', 'Stock']];
        const data = comics.map(comic => [
            comic.titulo,
            comic.numero_edicion,
            comic.editorial_nombre,
            comic.precio,
            comic.genero,
            comic.subgenero || '',
            comic.imagen_url || '',
            comic.descripcion || '',
            comic.estado || 'Disponible',
            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
        ]);

        if (mode === 'replace') {
            const values = [...headers, ...data];
            const range = `${sheetName}!A1:J${values.length}`;
            await clearSheet(`${sheetName}!A1:Z1000`);
            await updateSheetData(range, values);
        } else if (mode === 'update') {
            // Modo update: actualizar existentes y agregar nuevos
            const existingRows = await getSheetData(`${sheetName}!A2:J`);

            if (existingRows.length === 0) {
                const values = [...headers, ...data];
                await clearSheet(`${sheetName}!A1:Z1000`);
                await updateSheetData(`${sheetName}!A1:J${values.length}`, values);
            } else {
                const existingMap = new Map();
                existingRows.forEach((row, index) => {
                    if (row.length >= 3) {
                        const key = `${row[0]}_${row[1]}_${row[2]}`.toLowerCase();
                        existingMap.set(key, index + 2);
                    }
                });

                const rowsToAppend = [];

                for (const comic of comics) {
                    const key = `${comic.titulo}_${comic.numero_edicion}_${comic.editorial_nombre}`.toLowerCase();
                    const existingRowIndex = existingMap.get(key);

                    if (existingRowIndex) {
                        const rowData = [[
                            comic.titulo,
                            comic.numero_edicion,
                            comic.editorial_nombre,
                            comic.precio,
                            comic.genero,
                            comic.subgenero || '',
                            comic.imagen_url || '',
                            comic.descripcion || '',
                            comic.estado || 'Disponible',
                            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
                        ]];
                        await updateSheetData(`${sheetName}!A${existingRowIndex}:J${existingRowIndex}`, rowData);
                    } else {
                        rowsToAppend.push([
                            comic.titulo,
                            comic.numero_edicion,
                            comic.editorial_nombre,
                            comic.precio,
                            comic.genero,
                            comic.subgenero || '',
                            comic.imagen_url || '',
                            comic.descripcion || '',
                            comic.estado || 'Disponible',
                            comic.stock !== null && comic.stock !== undefined ? comic.stock : 0
                        ]);
                    }
                }

                if (rowsToAppend.length > 0) {
                    await appendSheetData(`${sheetName}!A:J`, rowsToAppend);
                }
            }
        }

        return { exported: comics.length, message: `${comics.length} comics exportados` };
    } catch (error) {
        console.error('Error en exportToSheetsInternal:', error);
        throw error;
    }
}

module.exports = {
    importFromSheets,
    exportToSheets,
    syncWithSheets
};

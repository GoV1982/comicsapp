const { getAll, getOne, runQuery } = require('../config/database');

// Define las funciones
const getComics = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Parámetros de búsqueda y filtros
        const search = req.query.search || '';
        const genero = req.query.genero || '';
        const editorial = req.query.editorial || '';
        const estado = req.query.estado || '';
        const sinImagen = req.query.sinImagen === 'true';
        const sort = req.query.sort || 'titulo';
        const order = req.query.order || 'asc';

        // Construir la consulta base
        let query = `
            SELECT c.*, e.nombre as editorial_nombre, s.cantidad_disponible as stock,
            COALESCE(AVG(r.puntuacion), 0) as promedio_puntuacion,
            COUNT(r.id) as total_reviews
            FROM comics c
            LEFT JOIN editoriales e ON c.editorial_id = e.id
            LEFT JOIN stock s ON c.id = s.comic_id
            LEFT JOIN reviews r ON c.id = r.comic_id
            WHERE 1=1
        `;

        const params = [];

        // Agregar filtros
        if (search) {
            query += ` AND (c.titulo LIKE ? OR c.numero_edicion LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (genero) {
            query += ` AND c.genero = ?`;
            params.push(genero);
        }

        if (editorial) {
            query += ` AND c.editorial_id = ?`;
            params.push(editorial);
        }

        if (estado) {
            if (estado === 'Novedad') {
                query += ` AND c.estado LIKE ?`;
                params.push('Novedad%');
            } else {
                query += ` AND c.estado = ?`;
                params.push(estado);
            }
        }

        if (sinImagen) {
            query += ` AND (c.imagen_url IS NULL OR c.imagen_url = '')`;
        }

        // Obtener el total de registros para paginación
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
        const countResult = await getOne(countQuery, params);
        const total = countResult.total;

        // Validar y construir ordenamiento
        const validSortFields = ['titulo', 'numero_edicion', 'precio', 'genero', 'editorial', 'stock'];
        const sortField = validSortFields.includes(sort) ? sort : 'titulo';
        const sortDirection = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        let orderBy;
        if (sortField === 'editorial') {
            orderBy = `e.nombre ${sortDirection}`;
        } else if (sortField === 'stock') {
            orderBy = `s.cantidad_disponible ${sortDirection}`;
        } else {
            orderBy = `c.${sortField} ${sortDirection}`;
        }

        // Si estamos filtrando por Novedad, primero ordenar por estado DESC (más recientes primero)
        if (estado === 'Novedad') {
            orderBy = `c.estado DESC, ${orderBy}`;
        }

        // Agregar ordenamiento y paginación
        query += ` GROUP BY c.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const comics = await getAll(query, params);

        // Calcular información de paginación
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            success: true,
            data: comics,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null
            },
            count: total
        });
    } catch (error) {
        console.error('Error al obtener comics:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message
        });
    }
};

const createComic = async (req, res) => {
    try {
        const { titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado } = req.body;
        const query = `
            INSERT INTO comics (titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await runQuery(query, [titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado || 'Disponible']);
        res.status(201).json({
            id: result.insertId,
            message: 'Comic creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getComicById = async (req, res) => {
    try {
        const query = 'SELECT * FROM comics WHERE id = ?';
        const comic = await getOne(query, [req.params.id]);
        if (!comic) {
            return res.status(404).json({ message: 'Comic no encontrado' });
        }
        res.json(comic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateComic = async (req, res) => {
    try {
        const { titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado } = req.body;
        const query = `
            UPDATE comics
            SET titulo = ?, numero_edicion = ?, editorial_id = ?, precio = ?, genero = ?, subgenero = ?, imagen_url = ?, descripcion = ?, estado = ?
            WHERE id = ?
        `;
        await runQuery(query, [titulo, numero_edicion, editorial_id, precio, genero, subgenero, imagen_url, descripcion, estado, req.params.id]);
        res.json({ message: 'Comic actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteComic = async (req, res) => {
    try {
        const comicId = req.params.id;

        // Verificar que el comic existe
        const comic = await getOne('SELECT id FROM comics WHERE id = ?', [comicId]);
        if (!comic) {
            return res.status(404).json({ message: 'Comic no encontrado' });
        }

        // Eliminar el comic de todos los carritos
        await runQuery('DELETE FROM carritos_items WHERE comic_id = ?', [comicId]);

        // Eliminar las reservas asociadas al comic
        await runQuery('DELETE FROM reservas WHERE comic_id = ?', [comicId]);

        // Eliminar referencias en ventas_detalle (historial, no se puede eliminar CASCADE)
        // await runQuery('DELETE FROM ventas_detalle WHERE comic_id = ?', [comicId]);

        // Eliminar referencias en compras_proveedor_detalle
        // await runQuery('DELETE FROM compras_proveedor_detalle WHERE comic_id = ?', [comicId]);

        // Eliminar el comic (el stock se eliminará automáticamente por CASCADE)
        await runQuery('DELETE FROM comics WHERE id = ?', [comicId]);

        res.json({ message: 'Comic eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar comic:', error);
        res.status(500).json({
            message: 'Error al eliminar el comic',
            error: error.message
        });
    }
};

const deleteComicsByFilters = async (req, res) => {
    try {
        const { editorial_id, titulo, deleteAll } = req.body;

        // Validación: si no es deleteAll, debe haber al menos un filtro
        if (!deleteAll && !editorial_id && !titulo) {
            return res.status(400).json({
                message: 'Debe especificar al menos un filtro o seleccionar "Eliminar todos los comics"'
            });
        }

        // Primero, obtener los IDs de los comics que se van a eliminar
        let selectQuery;
        const params = [];

        if (deleteAll) {
            // Seleccionar todos los comics
            selectQuery = 'SELECT id FROM comics';
        } else {
            // Construir consulta con filtros
            selectQuery = 'SELECT id FROM comics WHERE 1=1';

            if (editorial_id) {
                selectQuery += ' AND editorial_id = ?';
                params.push(editorial_id);
            }

            if (titulo) {
                selectQuery += ' AND titulo LIKE ?';
                params.push(`%${titulo}%`);
            }
        }

        // Obtener los IDs de los comics a eliminar
        const comicsToDelete = await getAll(selectQuery, params);

        if (comicsToDelete.length === 0) {
            return res.json({
                message: 'No se encontraron comics con los filtros especificados',
                deletedCount: 0
            });
        }

        const comicIds = comicsToDelete.map(c => c.id);
        console.log(`Eliminando ${comicIds.length} comics:`, comicIds);

        // Eliminar referencias en carritos_items para cada comic
        for (const comicId of comicIds) {
            await runQuery('DELETE FROM carritos_items WHERE comic_id = ?', [comicId]);
        }
        console.log('Referencias en carritos_items eliminadas');

        // Eliminar referencias en reservas para cada comic
        for (const comicId of comicIds) {
            await runQuery('DELETE FROM reservas WHERE comic_id = ?', [comicId]);
        }
        console.log('Referencias en reservas eliminadas');

        // Ahora eliminar los comics
        let deleteQuery;
        const deleteParams = [];

        if (deleteAll) {
            deleteQuery = 'DELETE FROM comics';
        } else {
            deleteQuery = 'DELETE FROM comics WHERE 1=1';

            if (editorial_id) {
                deleteQuery += ' AND editorial_id = ?';
                deleteParams.push(editorial_id);
            }

            if (titulo) {
                deleteQuery += ' AND titulo LIKE ?';
                deleteParams.push(`%${titulo}%`);
            }
        }

        const result = await runQuery(deleteQuery, deleteParams);

        res.json({
            message: result.changes === 1 ? 'Comic eliminado exitosamente' : `${result.changes} comics eliminados exitosamente`,
            deletedCount: result.changes
        });
    } catch (error) {
        console.error('Error al eliminar comics por filtros:', error);
        res.status(500).json({
            message: 'Error al eliminar comics',
            error: error.message
        });
    }
};

const getGeneros = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT genero 
            FROM comics 
            WHERE genero IS NOT NULL AND genero != ''
            ORDER BY genero ASC
        `;
        const generos = await getAll(query);
        res.json({
            success: true,
            data: generos.map(g => g.genero)
        });
    } catch (error) {
        console.error('Error al obtener géneros:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: error.message
        });
    }
};

// Exporta todas las funciones
module.exports = {
    getComics,
    createComic,
    getComicById,
    updateComic,
    deleteComic,
    deleteComicsByFilters,
    getGeneros
};

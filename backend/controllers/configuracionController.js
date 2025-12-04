const Configuracion = require('../models/Configuracion');

// Obtener configuración del cliente
const getConfiguracion = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const config = await Configuracion.getConfiguracion(clienteId);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración'
    });
  }
};

// Actualizar configuración del cliente
const updateConfiguracion = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const updates = req.body;

    const config = await Configuracion.updateConfiguracion(clienteId, updates);

    res.json({
      success: true,
      data: config,
      message: 'Configuración actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración'
    });
  }
};

// Agregar título favorito
const addTituloFavorito = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { comic_id } = req.body; // Frontend sends comic_id or comicId? Check api.js. 
    // api.js sends { comic_id: id } in addTituloFavorito.

    if (!comic_id) {
      return res.status(400).json({ success: false, message: 'ID de cómic requerido' });
    }

    await Configuracion.addTituloFavorito(clienteId, comic_id);

    res.json({
      success: true,
      message: 'Agregado a favoritos'
    });
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos'
    });
  }
};

// Eliminar título favorito
const removeTituloFavorito = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const { comicId } = req.params;

    await Configuracion.removeTituloFavorito(clienteId, comicId);

    res.json({
      success: true,
      message: 'Eliminado de favoritos'
    });
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de favoritos'
    });
  }
};

// Obtener títulos favoritos
const getTitulosFavoritos = async (req, res) => {
  try {
    const clienteId = req.cliente.id;
    const favoritos = await Configuracion.getTitulosFavoritos(clienteId);

    res.json({
      success: true,
      data: favoritos
    });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos'
    });
  }
};

module.exports = {
  getConfiguracion,
  updateConfiguracion,
  addTituloFavorito,
  removeTituloFavorito,
  getTitulosFavoritos
};

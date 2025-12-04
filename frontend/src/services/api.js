import axios from 'axios';

// Fallback for environment variable to support Jest testing environments
const API_URL = typeof process !== 'undefined' && process.env.VITE_API_URL
  ? process.env.VITE_API_URL
  : (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : 'http://localhost:3002/api');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token to each request
api.interceptors.request.use(
  (config) => {
    const clienteToken = localStorage.getItem('cliente_token');
    const adminToken = localStorage.getItem('auth_token');

    if (clienteToken) {
      config.headers.Authorization = `Bearer ${clienteToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle error responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo limpiar tokens y redirigir si estamos en rutas de admin
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      if (isAdminRoute) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        // En rutas públicas o de cliente, solo limpiar tokens de cliente si es necesario
        // pero no redirigir
        localStorage.removeItem('cliente_token');
        localStorage.removeItem('cliente');
      }
    }
    return Promise.reject(error);
  }
);

// Export the api instance and API_URL so tests can import and mock
export { api, API_URL };

// ============ EXPORT API CALLS ============
// Example for auth API, other api objects same as original
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },
};

export const authClientesAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth-cliente/login', { email, password });
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/auth-cliente/verify');
    return response.data;
  },
  register: async (clienteData) => {
    const response = await api.post('/auth-cliente/register', clienteData);
    return response.data;
  },
};

export const comicsAPI = {
  getAllComics: async (params) => {
    const response = await api.get('/comics', { params });
    return response.data;
  },
  getComicById: async (comicId) => {
    const response = await api.get(`/comics/${comicId}`);
    return response.data;
  },
  createComic: async (comicData) => {
    const response = await api.post('/comics', comicData);
    return response.data;
  },
  updateComic: async (comicId, comicData) => {
    const response = await api.put(`/comics/${comicId}`, comicData);
    return response.data;
  },
  deleteComic: async (comicId) => {
    const response = await api.delete(`/comics/${comicId}`);
    return response.data;
  },
  deleteByFilters: async (filters) => {
    const response = await api.delete('/comics/delete-by-filters', { data: filters });
    return response.data;
  },
  getGeneros: async () => {
    const response = await api.get('/comics/generos');
    return response.data;
  },
};

export const editorialesAPI = {
  getAllEditoriales: async () => {
    const response = await api.get('/editoriales');
    return response.data;
  },
  getEditorialById: async (editorialId) => {
    const response = await api.get(`/editoriales/${editorialId}`);
    return response.data;
  },
  createEditorial: async (editorialData) => {
    const response = await api.post('/editoriales', editorialData);
    return response.data;
  },
  updateEditorial: async (editorialId, editorialData) => {
    const response = await api.put(`/editoriales/${editorialId}`, editorialData);
    return response.data;
  },
  deleteEditorial: async (editorialId) => {
    const response = await api.delete(`/editoriales/${editorialId}`);
    return response.data;
  },
};

export const stockAPI = {
  getAllStock: async (params) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },
  getStockById: async (stockId) => {
    const response = await api.get(`/stock/${stockId}`);
    return response.data;
  },
  createStock: async (stockData) => {
    const response = await api.post('/stock', stockData);
    return response.data;
  },
  updateStock: async (stockId, stockData) => {
    const response = await api.put(`/stock/${stockId}`, stockData);
    return response.data;
  },
  deleteStock: async (stockId) => {
    const response = await api.delete(`/stock/${stockId}`);
    return response.data;
  },
  adjust: async (stockId, adjustment, motivo) => {
    const response = await api.patch(`/stock/${stockId}/adjust`, { ajuste: adjustment, motivo });
    return response.data;
  },
  getStockSummary: async () => {
    const response = await api.get('/stock/summary');
    return response.data;
  }
};

export const googleSheetsAPI = {
  getAllSheets: async () => {
    const response = await api.get('/google-sheets');
    return response.data;
  },
  getSheetById: async (sheetId) => {
    const response = await api.get(`/google-sheets/${sheetId}`);
    return response.data;
  },
  createSheet: async (sheetData) => {
    const response = await api.post('/google-sheets', sheetData);
    return response.data;
  },
  updateSheet: async (sheetId, sheetData) => {
    const response = await api.put(`/google-sheets/${sheetId}`, sheetData);
    return response.data;
  },
  deleteSheet: async (sheetId) => {
    const response = await api.delete(`/google-sheets/${sheetId}`);
    return response.data;
  },
  // Importar desde Google Sheets a la BD
  importComics: async (options = {}) => {
    const { sheetName = 'Comics', replaceExisting = false } = options;
    const response = await api.post('/sheets/comics/import', {
      sheetName,
      replaceExisting
    });
    return response.data;
  },
  // Exportar desde la BD a Google Sheets
  exportComics: async (comics, options = {}) => {
    const { sheetName = 'Comics', mode = 'replace' } = options;
    // mode: 'replace' (default), 'append', 'update'
    const response = await api.post('/sheets/comics/export', {
      sheetName,
      comics,
      mode
    });
    return response.data;
  },
  // Sincronizar con Google Sheets
  syncComics: async (options = {}) => {
    const {
      strategy = 'db-to-sheets',  // 'sheets-to-db', 'db-to-sheets', 'two-way-smart'
      sheetName = 'Comics',
      replaceOnConflict = true
    } = options;
    const response = await api.post('/sheets/comics/sync', {
      strategy,
      sheetName,
      replaceOnConflict
    });
    return response.data;
  },
};

export const clientesAPI = {
  getAllClientes: async () => {
    const response = await api.get('/clientes');
    return response.data;
  },
  getClienteById: async (clienteId) => {
    const response = await api.get(`/clientes/${clienteId}`);
    return response.data;
  },
  createCliente: async (clienteData) => {
    const response = await api.post('/clientes', clienteData);
    return response.data;
  },
  updateCliente: async (clienteId, clienteData) => {
    const response = await api.put(`/clientes/${clienteId}`, clienteData);
    return response.data;
  },
  deleteCliente: async (clienteId) => {
    const response = await api.delete(`/clientes/${clienteId}`);
    return response.data;
  },
};

export const perfilAPI = {
  getPerfil: async () => {
    const response = await api.get('/perfil');
    return response.data;
  },
  updatePerfil: async (perfilData) => {
    const response = await api.put('/perfil', perfilData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.post('/perfil/change-password', passwordData);
    return response.data;
  },
  getHistorialCompras: async () => {
    const response = await api.get('/perfil/historial-compras');
    return response.data;
  },
  deleteAccount: async () => {
    const response = await api.delete('/perfil/account');
    return response.data;
  },
};

export const configuracionAPI = {
  getAllConfiguracion: async () => {
    const response = await api.get('/configuracion');
    return response.data;
  },
  getConfiguracionById: async (configId) => {
    const response = await api.get(`/configuracion/${configId}`);
    return response.data;
  },
  createConfiguracion: async (configData) => {
    const response = await api.post('/configuracion', configData);
    return response.data;
  },
  // Métodos para configuración del cliente (perfil)
  getClientConfiguracion: async () => {
    const response = await api.get('/configuracion');
    return response.data;
  },
  updateClientConfiguracion: async (configData) => {
    const response = await api.put('/configuracion', configData);
    return response.data;
  },
  updateConfiguracion: async (configId, configData) => {
    const response = await api.put(`/configuracion/${configId}`, configData);
    return response.data;
  },
  deleteConfiguracion: async (configId) => {
    const response = await api.delete(`/configuracion/${configId}`);
    return response.data;
  },
  getGlobal: async () => {
    // Example: proxy to getAllConfiguracion or customized logic returning first config or empty data
    const response = await api.get('/configuracion/global');
    return response.data;
  },
  getConfiguracion: async () => {
    // Alias para getGlobal
    const response = await api.get('/configuracion/global');
    return response.data;
  },
  updateGlobal: async (configData) => {
    // Example: proxy to updateConfiguracion with global config id or custom logic
    const globalConfigId = 'global'; // Adjust as needed
    const response = await api.put(`/configuracion/${globalConfigId}`, configData);
    return response.data;
  },
  // Métodos de favoritos
  getTitulosFavoritos: async () => {
    const response = await api.get('/configuracion/favoritos');
    return response.data;
  },
  addTituloFavorito: async (comicId) => {
    const response = await api.post('/configuracion/favoritos', { comic_id: comicId });
    return response.data;
  },
  removeTituloFavorito: async (comicId) => {
    const response = await api.delete(`/configuracion/favoritos/${comicId}`);
    return response.data;
  }
};

export const publicAPI = {
  getAllPublicItems: async () => {
    // Obtener TODO el catálogo con límite alto
    return comicsAPI.getAllComics({ limit: 10000 });
  },

  // getCatalogo filtra por estado "Novedad" en el backend
  getCatalogo: async () => {
    return comicsAPI.getAllComics({ estado: 'Novedad', limit: 500 });  // Filtrar novedades en el backend
  },

  getEditoriales: async () => {
    const response = await api.get('/editoriales');
    return response.data;
  },

  getGeneros: async () => {
    const response = await api.get('/comics/generos');
    return response.data.data || [];
  },

  getPublicItemById: async (itemId) => {
    const response = await api.get(`/public/${itemId}`);
    return response.data;
  },
  createPublicItem: async (itemData) => {
    const response = await api.post('/public', itemData);
    return response.data;
  },
  updatePublicItem: async (itemId, itemData) => {
    const response = await api.put(`/public/${itemId}`, itemData);
    return response.data;
  },
  deletePublicItem: async (itemId) => {
    const response = await api.delete(`/public/${itemId}`);
    return response.data;
  },
};

export const reviewsAPI = {
  addReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },
  getReviews: async (comicId) => {
    const response = await api.get(`/reviews/${comicId}`);
    return response.data;
  },
  getSummary: async (comicId) => {
    const response = await api.get(`/reviews/summary/${comicId}`);
    return response.data;
  },
  getUserReview: async (comicId) => {
    const response = await api.get(`/reviews/user/${comicId}`);
    return response.data;
  },
  deleteReview: async (comicId) => {
    const response = await api.delete(`/reviews/${comicId}`);
    return response.data;
  }
};

export const contabilidadAPI = {
  getAllMovimientos: async (params) => {
    const response = await api.get('/contabilidad', { params });
    return response.data;
  },
  getMovimientoById: async (id) => {
    const response = await api.get(`/contabilidad/${id}`);
    return response.data;
  },
  createMovimiento: async (movimientoData) => {
    const response = await api.post('/contabilidad', movimientoData);
    return response.data;
  },
  updateMovimiento: async (id, movimientoData) => {
    const response = await api.put(`/contabilidad/${id}`, movimientoData);
    return response.data;
  },
  deleteMovimiento: async (id) => {
    const response = await api.delete(`/contabilidad/${id}`);
    return response.data;
  },
  getEstadisticas: async (params) => {
    const response = await api.get('/contabilidad/estadisticas', { params });
    return response.data;
  },
};




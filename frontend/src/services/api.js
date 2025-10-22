// src/services/api.js
import axios from 'axios';

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTENTICACIÓN ============

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
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// ============ EDITORIALES ============

export const editorialesAPI = {
  getAll: async () => {
    const response = await api.get('/editoriales');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/editoriales/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/editoriales', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/editoriales/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/editoriales/${id}`);
    return response.data;
  },
};

// ============ COMICS ============

export const comicsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/comics', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/comics/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/comics', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/comics/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/comics/${id}`);
    return response.data;
  },
  
  getGeneros: async () => {
    const response = await api.get('/comics/generos/list');
    return response.data;
  },
};

// ============ STOCK ============

export const stockAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock', { params });
    return response.data;
  },
  
  getByComicId: async (comicId) => {
    const response = await api.get(`/stock/comic/${comicId}`);
    return response.data;
  },
  
  update: async (comicId, cantidad) => {
    const response = await api.put(`/stock/comic/${comicId}`, {
      cantidad_disponible: cantidad,
    });
    return response.data;
  },
  
  adjust: async (comicId, ajuste, motivo = '') => {
    const response = await api.post(`/stock/comic/${comicId}/adjust`, {
      ajuste,
      motivo,
    });
    return response.data;
  },
  
  getSummary: async () => {
    const response = await api.get('/stock/summary');
    return response.data;
  },
};

// ============ PÚBLICO (sin autenticación) ============

export const publicAPI = {
  getCatalogo: async (params = {}) => {
    const response = await axios.get(`${API_URL}/public/catalogo`, { params });
    return response.data;
  },
  
  getComicById: async (id) => {
    const response = await axios.get(`${API_URL}/public/catalogo/${id}`);
    return response.data;
  },
  
  getEditoriales: async () => {
    const response = await axios.get(`${API_URL}/public/editoriales`);
    return response.data;
  },
  
  getGeneros: async () => {
    const response = await axios.get(`${API_URL}/public/generos`);
    return response.data;
  },
};

// ============ CLIENTES ============

export const clientesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/clientes', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },
  
  getHistorial: async (id) => {
    const response = await api.get(`/clientes/${id}/historial`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/clientes', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },
};

export default api;
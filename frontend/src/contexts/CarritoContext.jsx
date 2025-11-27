// src/contexts/CarritoContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuthClientes } from './AuthContextClientes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const CarritoContext = createContext(null);

// Función helper para generar sessionId único
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [cantidadItems, setCantidadItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuthClientes();

  // Cargar carrito al iniciar
  useEffect(() => {
    loadCarrito();
  }, [isAuthenticated, user]);

  // Actualizar total y cantidad de items cuando cambie el carrito
  useEffect(() => {
    const nuevoTotal = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    setTotal(nuevoTotal);
    const nuevaCantidad = carrito.reduce((total, item) => total + item.cantidad, 0);
    setCantidadItems(nuevaCantidad);
  }, [carrito]);

  const getSessionId = () => {
    let sessionId = localStorage.getItem('carrito_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('carrito_session_id', sessionId);
    }
    return sessionId;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cliente_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const loadCarrito = async () => {
    try {
      setLoading(true);

      let url = `${API_URL}/carrito`;
      let headers = { 'Content-Type': 'application/json' };

      if (isAuthenticated) {
        // Carrito autenticado
        headers = { ...headers, ...getAuthHeaders() };
      } else {
        // Carrito anónimo
        url = `${API_URL}/carrito/anon`;
        headers = { ...headers, 'x-session-id': getSessionId() };
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCarrito(data.data.items || []);
        }
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCarrito = async (comicId, cantidad = 1) => {
    try {
      setLoading(true);

      const data = { comic_id: comicId, cantidad };
      let headers = { 'Content-Type': 'application/json' };

      if (isAuthenticated) {
        headers = { ...headers, ...getAuthHeaders() };
      } else {
        headers = { ...headers, 'x-session-id': getSessionId() };
      }

      const url = isAuthenticated ? `${API_URL}/carrito/add` : `${API_URL}/carrito/add-anon`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await loadCarrito(); // Recargar carrito
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      return { success: false, message: 'Error al agregar al carrito' };
    } finally {
      setLoading(false);
    }
  };

  const updateCantidad = async (itemId, cantidad) => {
    try {
      setLoading(true);

      const data = { cantidad };
      let headers = { 'Content-Type': 'application/json' };

      if (isAuthenticated) {
        headers = { ...headers, ...getAuthHeaders() };
      } else {
        headers = { ...headers, 'x-session-id': getSessionId() };
      }

      const response = await fetch(`${API_URL}/carrito/anon/item/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        await loadCarrito(); // Recargar carrito
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      return { success: false, message: 'Error al actualizar cantidad' };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCarrito = async (itemId) => {
    try {
      setLoading(true);

      let headers = { 'Content-Type': 'application/json' };
      let url = `${API_URL}/carrito/item/${itemId}`;

      if (isAuthenticated) {
        headers = { ...headers, ...getAuthHeaders() };
      } else {
        headers = { ...headers, 'x-session-id': getSessionId() };
        url = `${API_URL}/carrito/anon/item/${itemId}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();

      if (result.success) {
        await loadCarrito(); // Recargar carrito
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error eliminando del carrito:', error);
      return { success: false, message: 'Error al eliminar del carrito' };
    } finally {
      setLoading(false);
    }
  };

  const clearCarrito = async () => {
    try {
      setLoading(true);

      let headers = { 'Content-Type': 'application/json' };
      let url = `${API_URL}/carrito/clear`;

      if (isAuthenticated) {
        headers = { ...headers, ...getAuthHeaders() };
      } else {
        headers = { ...headers, 'x-session-id': getSessionId() };
        url = `${API_URL}/carrito/anon/clear`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();

      if (result.success) {
        setCarrito([]);
        setTotal(0);
        setCantidadItems(0);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      return { success: false, message: 'Error al vaciar carrito' };
    } finally {
      setLoading(false);
    }
  };

  const getCantidadItems = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  const value = {
    carrito,
    total,
    loading,
    addToCarrito,
    updateCantidad,
    removeFromCarrito,
    clearCarrito,
    cantidadItems,
    loadCarrito
  };

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
};

// Hook personalizado para usar el contexto del carrito
export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de CarritoProvider');
  }
  return context;
};

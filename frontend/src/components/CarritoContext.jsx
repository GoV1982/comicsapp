import { createContext, useContext, useState, useEffect } from 'react';
import { carritoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const CarritoContext = createContext(null);

export const CarritoProvider = ({ children }) => {
  const { isClienteAuthenticated, cliente } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Generar sessionId único para usuarios no autenticados
  const getSessionId = () => {
    let sessionId = localStorage.getItem('carrito_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('carrito_session_id', sessionId);
    }
    return sessionId;
  };

  // Cargar carrito
  const loadCarrito = async () => {
    if (!isClienteAuthenticated && !getSessionId()) return;

    try {
      setLoading(true);
      let response;

      if (isClienteAuthenticated) {
        // Usuario autenticado - usar endpoint normal
        response = await carritoAPI.getCarrito();
      } else {
        // Usuario anónimo - usar endpoint anónimo con sessionId
        const sessionId = getSessionId();
        response = await fetch(`${API_URL}/carrito/anon`, {
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          }
        }).then(res => res.json());
      }

      if (response.success) {
        setCarrito(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agregar al carrito
  const addToCarrito = async (comicId, cantidad = 1) => {
    try {
      setLoading(true);
      let response;

      if (isClienteAuthenticated) {
        // Usuario autenticado - usar endpoint normal
        response = await carritoAPI.addToCarrito({ comic_id: comicId, cantidad });
      } else {
        // Usuario anónimo - usar endpoint anónimo
        const sessionId = getSessionId();
        response = await fetch(`${API_URL}/carrito/add-anon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          },
          body: JSON.stringify({ comic_id: comicId, cantidad })
        }).then(res => res.json());
      }

      if (response.success) {
        await loadCarrito(); // Recargar carrito
        return { success: true };
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      return { success: false, message: error.response?.data?.message || 'Error al agregar al carrito' };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad
  const updateCantidad = async (itemId, cantidad) => {
    try {
      setLoading(true);
      let response;

      if (isClienteAuthenticated) {
        // Usuario autenticado - usar endpoint normal
        response = await carritoAPI.updateCarritoItem(itemId, { cantidad });
      } else {
        // Usuario anónimo - usar endpoint anónimo
        const sessionId = getSessionId();
        response = await fetch(`${API_URL}/carrito/anon/item/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          },
          body: JSON.stringify({ cantidad })
        }).then(res => res.json());
      }

      if (response.success) {
        await loadCarrito();
        return { success: true };
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      return { success: false, message: error.response?.data?.message || 'Error al actualizar cantidad' };
    } finally {
      setLoading(false);
    }
  };

  // Remover del carrito
  const removeFromCarrito = async (itemId) => {
    try {
      setLoading(true);
      let response;

      if (isClienteAuthenticated) {
        // Usuario autenticado - usar endpoint normal
        response = await carritoAPI.removeFromCarrito(itemId);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        const sessionId = getSessionId();
        response = await fetch(`${API_URL}/carrito/anon/item/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          }
        }).then(res => res.json());
      }

      if (response.success) {
        await loadCarrito();
        return { success: true };
      }
    } catch (error) {
      console.error('Error al remover del carrito:', error);
      return { success: false, message: error.response?.data?.message || 'Error al remover del carrito' };
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito
  const clearCarrito = async () => {
    try {
      setLoading(true);
      let response;

      if (isClienteAuthenticated) {
        // Usuario autenticado - usar endpoint normal
        response = await carritoAPI.clearCarrito();
      } else {
        // Usuario anónimo - usar endpoint anónimo
        const sessionId = getSessionId();
        response = await fetch(`${API_URL}/carrito/anon/clear`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          }
        }).then(res => res.json());
      }

      if (response.success) {
        setCarrito([]);
        setTotal(0);
        return { success: true };
      }
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      return { success: false, message: error.response?.data?.message || 'Error al vaciar carrito' };
    } finally {
      setLoading(false);
    }
  };

  // Transferir carrito al autenticarse
  const transferCarrito = async () => {
    if (!isClienteAuthenticated) return;

    try {
      const sessionId = getSessionId();
      if (sessionId) {
        const response = await carritoAPI.transferCarrito();
        if (response.success) {
          localStorage.removeItem('carrito_session_id');
          await loadCarrito();
        }
      }
    } catch (error) {
      console.error('Error al transferir carrito:', error);
    }
  };

  // Cargar carrito cuando cambie el estado de autenticación
  useEffect(() => {
    if (isClienteAuthenticated || getSessionId()) {
      loadCarrito();
    } else {
      setCarrito([]);
      setTotal(0);
    }
  }, [isClienteAuthenticated]);

  // Transferir carrito cuando el cliente se autentique
  useEffect(() => {
    if (isClienteAuthenticated && cliente) {
      transferCarrito();
    }
  }, [isClienteAuthenticated, cliente]);

  const value = {
    carrito,
    total,
    loading,
    addToCarrito,
    updateCantidad,
    removeFromCarrito,
    clearCarrito,
    loadCarrito,
    cantidadItems: carrito.length
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de CarritoProvider');
  }
  return context;
};

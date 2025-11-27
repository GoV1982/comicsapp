// src/contexts/AuthContextClientes.jsx
import { createContext, useState, useContext, useEffect } from 'react';

// API para clientes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const authClienteAPI = {
  login: async (email, password, sessionId = null) => {
    const response = await fetch(`${API_URL}/auth-cliente/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, sessionId })
    });
    return response.json();
  },
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth-cliente/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
};

const AuthContextClientes = createContext(null);

export const AuthProviderClientes = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('cliente_auth_token');
      const savedUser = localStorage.getItem('cliente');

      if (token && savedUser) {
        try {
          // Verificar que el token sea válido
          const response = await fetch(`${API_URL}/auth-cliente/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            if (response.status === 404) {
              // Endpoint no existe, asumir token válido por ahora
              setUser(JSON.parse(savedUser));
              setIsAuthenticated(true);
              return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Token inválido');
          }

          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          // Token inválido, limpiar todo
          console.log('Token cliente inválido, limpiando sesión');
          logout();
        }
      }
    } catch (error) {
      console.error('Error en checkAuth cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login para clientes
  const login = async (email, password) => {
    try {
      // Obtener sessionId del carrito anónimo si existe
      const sessionId = localStorage.getItem('carrito_session_id');

      const response = await authClienteAPI.login(email, password, sessionId);

      if (response.success && response.token) {
        // Guardar token y usuario
        localStorage.setItem('cliente_auth_token', response.token);
        localStorage.setItem('cliente', JSON.stringify(response.user));

        setUser(response.user);
        setIsAuthenticated(true);

        // Limpiar sessionId del carrito anónimo ya que ahora es persistente
        localStorage.removeItem('carrito_session_id');

        return { success: true };
      }

      return { success: false, message: response.message || 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Error en login cliente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  // Registro de clientes
  const register = async (userData) => {
    try {
      const response = await authClienteAPI.register(userData);

      if (response.success) {
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrarse',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContextClientes.Provider value={value}>{children}</AuthContextClientes.Provider>;
};

// Hook personalizado para usar el contexto de clientes
export const useAuthClientes = () => {
  const context = useContext(AuthContextClientes);
  if (!context) {
    throw new Error('useAuthClientes debe ser usado dentro de AuthProviderClientes');
  }
  return context;
};

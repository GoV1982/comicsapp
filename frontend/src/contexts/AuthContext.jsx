import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, authClientesAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClienteAuthenticated, setIsClienteAuthenticated] = useState(false);

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      const clienteToken = localStorage.getItem('cliente_token');
      const savedCliente = localStorage.getItem('cliente');

      // Verificar admin
      if (token && savedUser) {
        try {
          await authAPI.verifyToken();
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.log('Token admin inválido, limpiando sesión');
          logout();
        }
      }

      // Verificar cliente
      if (clienteToken && savedCliente) {
        try {
          await authClientesAPI.verifyToken();
          setCliente(JSON.parse(savedCliente));
          setIsClienteAuthenticated(true);
        } catch (error) {
          console.log('Token cliente inválido, limpiando sesión');
          logoutCliente();
        }
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);

      if (response.success && response.token) {
        // Guardar token y usuario
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        setUser(response.user);
        setIsAuthenticated(true);

        return { success: true };
      }

      return { success: false, message: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const loginCliente = async (email, password) => {
    try {
      const response = await authClientesAPI.login(email, password);

      if (response.success && response.token) {
        // Guardar token y cliente
        localStorage.setItem('cliente_token', response.token);
        localStorage.setItem('cliente', JSON.stringify(response.cliente));

        setCliente(response.cliente);
        setIsClienteAuthenticated(true);

        return { success: true };
      }

      return { success: false, message: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Error en login cliente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const registerCliente = async (clienteData) => {
    try {
      const response = await authClientesAPI.register(clienteData);

      if (response.success) {
        return { success: true, message: response.message };
      }

      return { success: false, message: 'Error en el registro' };
    } catch (error) {
      console.error('Error en registro cliente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el registro',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const logoutCliente = () => {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente');
    setCliente(null);
    setIsClienteAuthenticated(false);
  };

  const value = {
    // Admin
    user,
    isAuthenticated,
    login,
    logout,

    // Cliente
    cliente,
    isClienteAuthenticated,
    loginCliente,
    registerCliente,
    logoutCliente,

    // General
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCarrito } from '../contexts/CarritoContext';
import { perfilAPI, configuracionAPI } from '../services/api';
import CarritoModal from '../components/CarritoModal';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Settings,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Edit,
  ArrowLeft
} from 'lucide-react';

export default function PerfilCliente() {
  const { cliente, logoutCliente } = useAuth();
  const { addToCarrito, cantidadItems } = useCarrito();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCarritoModal, setShowCarritoModal] = useState(false);

  // Estado del perfil
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    notas: ''
  });

  // Estado de configuración
  const [configData, setConfigData] = useState({
    notificaciones_email: true,
    notificaciones_whatsapp: false,
    notificaciones_similares: true,
    mostrar_favoritos: true,
    privacidad_perfil: 'publico'
  });

  // Estado de cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Estado de favoritos
  const [favoritos, setFavoritos] = useState([]);
  const [historial, setHistorial] = useState([]);

  // Errores
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activeTab === 'perfil') loadPerfil();
    else if (activeTab === 'configuracion') loadConfiguracion();
    else if (activeTab === 'favoritos') loadFavoritos();
    else if (activeTab === 'historial') loadHistorial();
  }, [activeTab]);

  const loadPerfil = async () => {
    try {
      setLoading(true);
      const response = await perfilAPI.getPerfil();
      if (response.success) {
        setPerfilData({
          nombre: response.data.nombre || '',
          email: response.data.email || '',
          telefono: response.data.telefono || '',
          whatsapp: response.data.whatsapp || '',
          direccion: response.data.direccion || '',
          notas: response.data.notas || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await configuracionAPI.getClientConfiguracion();
      if (response.success) {
        const data = response.data || {};
        setConfigData({
          notificaciones_email: data.notificaciones === 1,
          notificaciones_whatsapp: false, // No soportado en backend aún
          notificaciones_similares: data.notificaciones_similares === 1,
          mostrar_favoritos: true, // No soportado en backend aún
          privacidad_perfil: 'publico' // No soportado en backend aún
        });
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritos = async () => {
    try {
      setLoading(true);
      const response = await configuracionAPI.getTitulosFavoritos();
      if (response.success) {
        setFavoritos(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async () => {
    try {
      setLoading(true);
      const response = await perfilAPI.getHistorialCompras();
      if (response.success) {
        setHistorial(response.data.ventas || []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePerfilSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrors({});

    try {
      const response = await perfilAPI.updatePerfil(perfilData);
      if (response.success) {
        setMessage('Perfil actualizado correctamente');
      } else {
        setErrors(response.errors || {});
      }
    } catch (error) {
      setMessage('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await configuracionAPI.updateClientConfiguracion(configData);
      if (response.success) {
        setMessage('Configuración actualizada correctamente');
      }
    } catch (error) {
      setMessage('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrors({});

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    try {
      const response = await perfilAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (response.success) {
        setMessage('Contraseña cambiada correctamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setErrors(response.errors || {});
      }
    } catch (error) {
      setMessage('Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorito = async (comicId) => {
    try {
      await configuracionAPI.removeTituloFavorito(comicId);
      loadFavoritos();
    } catch (error) {
      console.error('Error al remover favorito:', error);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'historial', label: 'Historial', icon: ShoppingBag },
    { id: 'seguridad', label: 'Seguridad', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{cliente?.nombre}</h1>
                <p className="text-primary-100">{cliente?.email}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Volver</span>
                </button>
                <button
                  onClick={() => setShowCarritoModal(true)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Ver carrito"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Carrito</span>
                  {cantidadItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {cantidadItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Mensaje de resultado */}
            {message && (
              <div className={`mb-6 p-4 rounded-md ${message.includes('correctamente') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {message.includes('correctamente') ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  <p className={`ml-3 text-sm ${message.includes('correctamente') ? 'text-green-800' : 'text-red-800'}`}>
                    {message}
                  </p>
                </div>
              </div>
            )}

            {/* Perfil Tab */}
            {activeTab === 'perfil' && (
              <form onSubmit={handlePerfilSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={perfilData.nombre}
                      onChange={(e) => setPerfilData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={perfilData.email}
                      onChange={(e) => setPerfilData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={perfilData.telefono}
                      onChange={(e) => setPerfilData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={perfilData.whatsapp}
                      onChange={(e) => setPerfilData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    value={perfilData.direccion}
                    onChange={(e) => setPerfilData(prev => ({ ...prev, direccion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={perfilData.notas}
                    onChange={(e) => setPerfilData(prev => ({ ...prev, notas: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      logoutCliente();
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {/* Configuración Tab */}
            {activeTab === 'configuracion' && (
              <form onSubmit={handleConfigSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notificaciones</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configData.notificaciones_email}
                          onChange={(e) => setConfigData(prev => ({ ...prev, notificaciones_email: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Recibir notificaciones por email</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configData.notificaciones_whatsapp}
                          onChange={(e) => setConfigData(prev => ({ ...prev, notificaciones_whatsapp: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Recibir notificaciones por WhatsApp</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configData.notificaciones_similares}
                          onChange={(e) => setConfigData(prev => ({ ...prev, notificaciones_similares: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Recibir notificaciones de nuevos cómics similares a mis favoritos</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Privacidad</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configData.mostrar_favoritos}
                          onChange={(e) => setConfigData(prev => ({ ...prev, mostrar_favoritos: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Mostrar mis títulos favoritos públicamente</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Privacidad del perfil
                        </label>
                        <select
                          value={configData.privacidad_perfil}
                          onChange={(e) => setConfigData(prev => ({ ...prev, privacidad_perfil: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="publico">Público</option>
                          <option value="amigos">Solo amigos</option>
                          <option value="privado">Privado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar Configuración
                  </button>
                </div>
              </form>
            )}

            {/* Favoritos Tab */}
            {activeTab === 'favoritos' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                ) : favoritos.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes títulos favoritos
                    </h3>
                    <p className="text-gray-500">
                      Agrega cómics a tus favoritos desde el catálogo
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoritos.map((comic) => (
                      <div key={comic.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0">
                            {comic.imagen_url && (
                              <img
                                src={comic.imagen_url}
                                alt={comic.titulo}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {comic.titulo}
                            </h4>
                            <p className="text-xs text-gray-500">
                              #{comic.numero_edicion} • {comic.editorial_nombre}
                            </p>
                            <p className="text-sm font-medium text-primary-600 mt-1">
                              ${comic.precio}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleRemoveFavorito(comic.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Eliminar de favoritos"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </button>
                            <button
                              onClick={async () => {
                                const result = await addToCarrito(comic.id, 1);
                                if (result.success) {
                                  setMessage('Producto agregado al carrito correctamente');
                                  setTimeout(() => setMessage(''), 3000);
                                }
                              }}
                              className="text-primary-600 hover:text-primary-800 p-1"
                              title="Agregar al carrito"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Historial Tab */}
            {activeTab === 'historial' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes compras registradas
                    </h3>
                    <p className="text-gray-500">
                      Tus futuras compras aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historial.map((compra) => (
                      <div key={compra.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Compra #{compra.id}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(compra.fecha).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            {compra.estado}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {compra.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.titulo} (x{item.cantidad})</span>
                              <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${compra.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Seguridad Tab */}
            {activeTab === 'seguridad' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nueva contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Cambiar Contraseña
                      </button>
                    </div>
                  </form>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Eliminar Cuenta</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Esta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                        // Implementar eliminación de cuenta
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CarritoModal
        isOpen={showCarritoModal}
        onClose={() => setShowCarritoModal(false)}
      />
    </div>
  );
}

// src/pages/admin/Configuracion.jsx
import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { configuracionAPI } from '../../services/api';

export default function Configuracion() {
  const [config, setConfig] = useState({
    whatsapp_numero: '',
    tienda_nombre: '',
    email_contacto: '',
    moneda: 'ARS',
    zona_horaria: 'America/Argentina/Buenos_Aires',
    facebook: '',
    instagram: '',
    twitter: '',
    logo_url: '',
    descripcion_tienda: '',
    direccion: '',
    telefono: '',
    horario_atencion: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await configuracionAPI.getGlobal();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      setMessage('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');

      const response = await configuracionAPI.updateGlobal(config);
      if (response.success) {
        setMessage('Configuración guardada exitosamente');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMessage('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración General</h1>
        <p className="text-gray-600">
          Configura los ajustes globales de la tienda
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Información de la Tienda</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre de la Tienda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Tienda *
              </label>
              <input
                type="text"
                value={config.tienda_nombre ?? ''}
                onChange={(e) => handleChange('tienda_nombre', e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Email de Contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Contacto *
              </label>
              <input
                type="email"
                value={config.email_contacto ?? ''}
                onChange={(e) => handleChange('email_contacto', e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Número de WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de WhatsApp
              </label>
              <input
                type="text"
                value={config.whatsapp_numero ?? ''}
                onChange={(e) => handleChange('whatsapp_numero', e.target.value)}
                className="input"
                placeholder="5491234567890"
              />
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                value={config.moneda ?? 'ARS'}
                onChange={(e) => handleChange('moneda', e.target.value)}
                className="input"
                required
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Zona Horaria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria *
              </label>
              <select
                value={config.zona_horaria ?? 'America/Argentina/Buenos_Aires'}
                onChange={(e) => handleChange('zona_horaria', e.target.value)}
                className="input"
                required
              >
                <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                <option value="America/Mexico_City">México (Ciudad de México)</option>
                <option value="America/Santiago">Chile (Santiago)</option>
                <option value="America/Lima">Perú (Lima)</option>
                <option value="America/Bogota">Colombia (Bogotá)</option>
              </select>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Logo
              </label>
              <input
                type="url"
                value={config.logo_url ?? ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                className="input"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Redes Sociales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facebook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={config.facebook ?? ''}
                onChange={(e) => handleChange('facebook', e.target.value)}
                className="input"
                placeholder="https://facebook.com/tienda"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={config.instagram ?? ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className="input"
                placeholder="https://instagram.com/tienda"
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="url"
                value={config.twitter ?? ''}
                onChange={(e) => handleChange('twitter', e.target.value)}
                className="input"
                placeholder="https://twitter.com/tienda"
              />
            </div>
          </div>
        </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      );
    }

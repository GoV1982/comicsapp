import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    comicId: '',
    cantidad: '',
    precio: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    clienteId: '',
  });

  useEffect(() => {
    loadVentas();
  }, []);

  const loadVentas = async () => {
    try {
      const response = await api.get('/ventas');
      // inspecciona la respuesta en consola para verificar su forma
      console.log('API /ventas response.data =', response.data);

      // Normaliza la respuesta: si response.data es un array úsalo,
      // si viene como { ventas: [...] } toma esa propiedad, si no, usa array vacío.
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.ventas)
        ? response.data.ventas
        : [];

      setVentas(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las ventas');
      setLoading(false);
    }
  };

  const handleOpenModal = (venta = null) => {
    if (venta) {
      setFormData({
        comicId: venta.comicId,
        cantidad: venta.cantidad,
        precio: venta.precio,
        fecha: format(new Date(venta.fecha), 'yyyy-MM-dd'),
        clienteId: venta.clienteId,
      });
      setEditingId(venta._id);
    } else {
      setFormData({
        comicId: '',
        cantidad: '',
        precio: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        clienteId: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      comicId: '',
      cantidad: '',
      precio: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      clienteId: '',
    });
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/ventas/${editingId}`, formData);
      } else {
        await api.post('/ventas', formData);
      }
      loadVentas();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta venta?')) {
      try {
        await api.delete(`/ventas/${id}`);
        loadVentas();
      } catch (err) {
        setError('Error al eliminar la venta');
      }
    }
  };

  // antes de renderizar la tabla, asegúrate de trabajar con un array
  const ventasArray = Array.isArray(ventas) ? ventas : ventas?.ventas || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ventas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar ventas..."
          className="w-full px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Modal de Venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Editar Venta' : 'Nueva Venta'}
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comic ID
                </label>
                <input
                  type="text"
                  value={formData.comicId}
                  onChange={(e) => setFormData({...formData, comicId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasArray.map((venta) => (
              <tr key={venta._id}>
                <td className="px-6 py-4 whitespace-nowrap">{venta.comicId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{venta.cantidad}</td>
                <td className="px-6 py-4 whitespace-nowrap">${venta.precio}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(venta.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(venta)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(venta._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
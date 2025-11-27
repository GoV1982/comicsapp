import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export default function Ventas() {
  // Inicializa los estados como arrays vacíos
  const [ventas, setVentas] = useState([]);
  const [comics, setComics] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    comicId: '',
    cantidad: '',
    precio: '', // precio unitario
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: '',
    descuento: 0, // porcentaje
  });

  // Asegúrate de que comics y clientes sean arrays antes de usarlos
  const comicsOptions = Array.isArray(comics) ? comics : [];
  const clientesOptions = Array.isArray(clientes) ? clientes : [];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ventasRes, comicsRes, clientesRes] = await Promise.all([
          api.get('/ventas'),
          api.get('/comics'),
          api.get('/clientes')
        ]);

        setVentas(Array.isArray(ventasRes.data) ? ventasRes.data : []);
        setComics(Array.isArray(comicsRes.data) ? comicsRes.data : []);
        setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar los datos');
        setVentas([]);
        setComics([]);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOpenModal = (venta = null) => {
    if (venta) {
      setFormData({
        comicId: venta.comicId,
        cantidad: venta.cantidad,
        precio: venta.precio,
        fecha: new Date(venta.fecha).toISOString().slice(0, 10),
        clienteId: venta.clienteId,
        descuento: venta.descuento ?? 0,
      });
      setEditingId(venta._id);
    } else {
      setFormData({
        comicId: '',
        cantidad: '',
        precio: '',
        fecha: new Date().toISOString().slice(0, 10),
        clienteId: '',
        descuento: 0,
      });
      setEditingId(null);
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      comicId: '',
      cantidad: '',
      precio: '',
      fecha: new Date().toISOString().slice(0, 10),
      clienteId: '',
      descuento: 0,
    });
    setEditingId(null);
    setError('');
  };

  // cuando seleccionas un comic, autocompleta el precio unitario
  const handleSelectComic = (comicId) => {
    const selected = comics.find((c) => String(c._id || c.id) === String(comicId));
    const precioUnitario = selected?.precio ?? selected?.price ?? 0;
    setFormData((prev) => ({
      ...prev,
      comicId,
      precio: precioUnitario,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // normaliza tipos numéricos
      const payload = {
        ...formData,
        cantidad: Number(formData.cantidad) || 0,
        precio: Number(formData.precio) || 0,
        descuento: Number(formData.descuento) || 0,
      };

      if (editingId) {
        await api.put(`/ventas/${editingId}`, payload);
      } else {
        await api.post('/ventas', payload);
      }
      // Recarga todos los datos
      await loadData();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta venta?')) {
      try {
        await api.delete(`/ventas/${id}`);
        await loadData(); // Recarga todos los datos
      } catch (err) {
        setError('Error al eliminar la venta');
      }
    }
  };

  const ventasArray = Array.isArray(ventas) ? ventas : ventas?.ventas || [];

  // cálculo del total mostrado en el formulario
  const totalCalculado = (() => {
    const cantidad = Number(formData.cantidad) || 0;
    const precio = Number(formData.precio) || 0;
    const descuento = Number(formData.descuento) || 0;
    const total = precio * cantidad * (1 - descuento / 100);
    return isFinite(total) ? total.toFixed(2) : '0.00';
  })();

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  Comic
                </label>
                <select
                  required
                  value={formData.comicId}
                  onChange={(e) => handleSelectComic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Seleccione un cómic --</option>
                  {comicsOptions.map((comic) => (
                    <option key={comic._id} value={comic._id}>
                      {comic.titulo || 'Sin título'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio unitario
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">-- Seleccione cliente (opcional) --</option>
                    {clientesOptions.map((cliente) => (
                      <option key={cliente._id} value={cliente._id}>
                        {cliente.nombre || cliente.email || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <input
                  readOnly
                  value={`$ ${totalCalculado}`}
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
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
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar'}
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
                Descuento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasArray.map((venta) => {
              const comic = comics.find(c => c._id === venta.comicId);
              const cliente = clientes.find(c => c._id === venta.clienteId);
              const total = (venta.precio * venta.cantidad * (1 - (venta.descuento || 0) / 100)).toFixed(2);

              return (
                <tr key={venta._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comic ? comic.titulo : 'Comic no encontrado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{venta.cantidad}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${venta.precio}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{venta.descuento || 0}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(venta.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${total}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cliente && (
                      <span className="text-sm text-gray-500">
                        Cliente: {cliente.nombre}
                      </span>
                    )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
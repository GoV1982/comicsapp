import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Pencil, Trash2, MessageCircle, Save, Search, UserPlus, X, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { api } from '../../services/api';

// Componente de búsqueda de comics
const ComicSearch = ({ comics, value, onSelect, disabled }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selected = comics.find(c => String(c.id || c._id) === String(value));
      if (selected) {
        setQuery(selected.titulo);
      }
    } else {
      setQuery('');
    }
  }, [value, comics]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = query.trim() === ''
    ? []
    : comics.filter(c => c.titulo.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
          if (e.target.value === '') onSelect(null);
        }}
        onFocus={() => !disabled && setShowSuggestions(true)}
        className="w-full text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        placeholder="Buscar comic..."
        disabled={disabled}
      />
      {showSuggestions && filtered.length > 0 && !disabled && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1 left-0">
          {filtered.map(c => (
            <li
              key={c.id || c._id}
              onClick={() => {
                onSelect(c);
                setQuery(c.titulo);
                setShowSuggestions(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-900">{c.titulo}</div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>#{c.numero_edicion} - {c.editorial_nombre}</span>
                <span className={c.stock > 0 ? "text-green-600" : "text-red-600"}>
                  Stock: {c.stock}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [comics, setComics] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Estados para el modal de nuevo cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    nombre: '', email: '', telefono: '', direccion: '', notas: ''
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    items: [],
    clienteId: '',
    clienteNombre: '',
    clienteTelefono: '',
    estado: 'completada',
    notas: '',
    metodo_pago: 'efectivo',
    fecha: ''
  });

  const comicsOptions = Array.isArray(comics) ? comics : [];
  const clientesOptions = Array.isArray(clientes) ? clientes : [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventasRes, comicsRes, clientesRes] = await Promise.all([
        api.get('/ventas'),
        api.get('/comics?limit=2000'),
        api.get('/clientes?limit=1000')
      ]);

      console.log('📊 API Response - Ventas:', ventasRes);

      const ventasData = ventasRes.data.data || [];
      const comicsData = comicsRes.data.data || [];
      const clientesData = clientesRes.data.data || [];

      setVentas(Array.isArray(ventasData) ? ventasData : []);
      setComics(Array.isArray(comicsData) ? comicsData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar los datos');
      setVentas([]);
      setComics([]);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (venta = null) => {
    setError('');
    if (venta) {
      setEditingId(venta.id || venta._id);
      setShowModal(true);
      setLoadingDetails(true);

      try {
        const res = await api.get(`/ventas/${venta.id || venta._id}`);
        const fullVenta = res.data.data;

        setFormData({
          items: fullVenta.detalle ? fullVenta.detalle.map(d => ({
            comicId: d.comic_id,
            titulo: d.comic_titulo,
            editorial: d.editorial_nombre,
            cantidad: d.cantidad,
            precio: d.precio_unitario,
            descuento: d.descuento || 0
          })) : [],
          clienteId: fullVenta.cliente_id || '',
          clienteNombre: fullVenta.cliente_nombre || 'Cliente Casual',
          clienteTelefono: fullVenta.cliente_whatsapp || fullVenta.cliente_telefono || '',
          estado: fullVenta.estado || 'completada',
          notas: fullVenta.notas || '',
          metodo_pago: fullVenta.metodo_pago || 'efectivo',
          fecha: fullVenta.fecha_venta || new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
        setError('Error al cargar los detalles de la venta');
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setFormData({
        items: [],
        clienteId: '',
        clienteNombre: '',
        clienteTelefono: '',
        estado: 'completada',
        notas: '',
        metodo_pago: 'efectivo',
        fecha: new Date().toISOString()
      });
      setEditingId(null);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { comicId: '', titulo: '', editorial: '', cantidad: 1, precio: 0, descuento: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          comic_id: item.comicId,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio),
          descuento: Number(item.descuento) || 0
        })),
        cliente_id: formData.clienteId
      };

      if (editingId) {
        await api.put(`/ventas/${editingId}`, {
          estado: formData.estado,
          notas: formData.notas,
          metodo_pago: formData.metodo_pago,
          items: payload.items
        });
      } else {
        await api.post('/ventas', payload);
      }

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
        await loadData();
      } catch (err) {
        setError('Error al eliminar la venta');
      }
    }
  };

  const handleWhatsApp = (venta) => {
    const telefono = venta.cliente_whatsapp || venta.cliente_telefono;
    if (!telefono) {
      alert('El cliente no tiene número de teléfono registrado');
      return;
    }

    const cleanPhone = telefono.replace(/\D/g, '');
    const formattedPhone = `549${cleanPhone}`;

    const mensaje = `Hola ${venta.cliente_nombre}, te escribo sobre tu pedido #${venta.id}.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // Handlers para nuevo cliente
  const handleOpenClientModal = () => {
    setClientFormData({ nombre: '', email: '', telefono: '', direccion: '', notas: '' });
    setShowClientModal(true);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setClientSubmitting(true);
    try {
      const res = await api.post('/clientes', clientFormData);
      const newClient = res.data.data;

      // Recargar clientes
      const clientesRes = await api.get('/clientes?limit=1000');
      setClientes(clientesRes.data.data || []);

      // Seleccionar el nuevo cliente
      setFormData(prev => ({
        ...prev,
        clienteId: newClient.id,
        clienteNombre: newClient.nombre,
        clienteTelefono: newClient.whatsapp || newClient.telefono || ''
      }));

      handleCloseClientModal();
    } catch (err) {
      alert('Error al crear cliente: ' + (err.response?.data?.message || err.message));
    } finally {
      setClientSubmitting(false);
    }
  };

  const ventasArray = Array.isArray(ventas) ? ventas : [];

  const totalCalculado = formData.items.reduce((sum, item) => {
    const subtotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
    const discountAmount = subtotal * ((Number(item.descuento) || 0) / 100);
    return sum + (subtotal - discountAmount);
  }, 0).toFixed(2);

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
        <h1 className="text-2xl font-semibold text-gray-900">Ventas ({ventasArray.length})</h1>
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

      {ventasArray.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium">⚠️ No hay ventas para mostrar</p>
          <p className="text-yellow-700 text-sm mt-1">Verifica la consola del navegador para más detalles</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Editar Venta' : 'Nueva Venta'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {loadingDetails ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-lg font-medium text-gray-900">Detalle del Pedido</h3>
                      {!editingId && (
                        <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                          <Plus className="h-4 w-4" /> Agregar Item
                        </button>
                      )}
                    </div>

                    <div className="overflow-visible min-h-[200px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-1/3">Producto</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Cant.</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Precio</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Desc %</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Subtotal</th>
                            {!editingId && <th className="px-3 py-2 w-10"></th>}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => {
                            const subtotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
                            const totalItem = subtotal * (1 - (Number(item.descuento) || 0) / 100);

                            return (
                              <tr key={index} className="align-top">
                                <td className="px-3 py-2">
                                  {editingId ? (
                                    <div>
                                      <div className="font-medium text-gray-900">{item.titulo}</div>
                                      <div className="text-xs text-gray-500">{item.editorial}</div>
                                    </div>
                                  ) : (
                                    <ComicSearch
                                      comics={comicsOptions}
                                      value={item.comicId}
                                      onSelect={(comic) => {
                                        const newItems = [...formData.items];
                                        if (comic) {
                                          newItems[index] = {
                                            ...newItems[index],
                                            comicId: comic.id || comic._id,
                                            titulo: comic.titulo,
                                            editorial: comic.editorial_nombre,
                                            precio: comic.precio || 0
                                          };
                                        } else {
                                          newItems[index] = {
                                            ...newItems[index],
                                            comicId: '',
                                            titulo: '',
                                            editorial: '',
                                            precio: 0
                                          };
                                        }
                                        setFormData({ ...formData, items: newItems });
                                      }}
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.cantidad}
                                    onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md"
                                    disabled={!!editingId}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.precio}
                                      onChange={(e) => updateItem(index, 'precio', e.target.value)}
                                      className="w-full pl-5 text-sm border-gray-300 rounded-md"
                                      disabled={!!editingId}
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.descuento}
                                    onChange={(e) => updateItem(index, 'descuento', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">
                                  ${totalItem.toFixed(2)}
                                </td>
                                {!editingId && (
                                  <td className="px-3 py-2 text-center">
                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          {formData.items.length === 0 && (
                            <tr>
                              <td colSpan="6" className="px-3 py-8 text-center text-gray-500 text-sm">
                                No hay items en el pedido
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold text-gray-900">
                          <tr>
                            <td colSpan="4" className="px-3 py-3 text-right">Total Final:</td>
                            <td className="px-3 py-3 text-right text-lg text-primary-600">${totalCalculado}</td>
                            {!editingId && <td></td>}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Cliente y Acciones</h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Cliente
                          </label>
                          {!editingId && (
                            <button
                              type="button"
                              onClick={handleOpenClientModal}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                              <UserPlus className="h-3 w-3" /> Nuevo Cliente
                            </button>
                          )}
                        </div>
                        {editingId ? (
                          <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700 font-medium">
                            {formData.clienteNombre}
                          </div>
                        ) : (
                          <select
                            value={formData.clienteId}
                            onChange={(e) => {
                              const selectedClient = clientes.find(c => String(c.id || c._id) === String(e.target.value));
                              setFormData({
                                ...formData,
                                clienteId: e.target.value,
                                clienteNombre: selectedClient ? selectedClient.nombre : '',
                                clienteTelefono: selectedClient ? (selectedClient.whatsapp || selectedClient.telefono) : ''
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">-- Seleccione cliente (opcional) --</option>
                            {clientesOptions.map((cliente) => (
                              <option key={cliente.id || cliente._id} value={cliente.id || cliente._id}>
                                {cliente.nombre || cliente.email || 'Sin nombre'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado del Pedido
                        </label>
                        <select
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md font-medium ${formData.estado === 'pendiente' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                              formData.estado === 'completada' ? 'bg-green-50 text-green-800 border-green-200' :
                                'bg-red-50 text-red-800 border-red-200'
                            }`}
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="completada">✅ Completada</option>
                          <option value="cancelada">❌ Cancelada</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={formData.metodo_pago}
                          onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="tarjeta">Tarjeta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas / Observaciones
                        </label>
                        <textarea
                          value={formData.notas}
                          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                          rows="3"
                          placeholder="Detalles de envío, instrucciones especiales..."
                        />
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Opciones de Gestión</h4>
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                          <span>Pago confirmado</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                          <span>Envío programado</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
                          <span>Notificar al cliente por email</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const telefono = formData.clienteTelefono;

                          if (!telefono) {
                            alert('El cliente seleccionado no tiene número de teléfono registrado');
                            return;
                          }

                          const cleanPhone = telefono.replace(/\D/g, '');
                          const formattedPhone = `549${cleanPhone}`;

                          let mensaje = `Hola ${formData.clienteNombre || ''}, te envío el detalle de tu pedido:\n\n`;

                          formData.items.forEach(item => {
                            const subtotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
                            const totalItem = subtotal * (1 - (Number(item.descuento) || 0) / 100);
                            mensaje += `📚 *${item.titulo}*\n` +
                              `   ${item.cantidad} x $${item.precio} ` +
                              (Number(item.descuento) > 0 ? `(-${item.descuento}%)` : '') +
                              ` = $${totalItem.toFixed(2)}\n`;
                          });

                          const fechaFormatted = new Date(formData.fecha).toLocaleDateString('es-ES');

                          mensaje += `\n💰 *TOTAL A PAGAR: $${totalCalculado}*\n\n` +
                            `Estado: ${formData.estado.toUpperCase()}\n` +
                            `Fecha: ${fechaFormatted}\n` +
                            `Método de pago: ${formData.metodo_pago.toUpperCase()}\n` +
                            (formData.notas ? `Notas: ${formData.notas}` : '');

                          window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Enviar cuenta por WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={handleCloseClientModal}></div>
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Nuevo Cliente</h3>
                <button onClick={handleCloseClientModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={clientFormData.nombre}
                      onChange={(e) => setClientFormData({ ...clientFormData, nombre: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={clientSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={clientFormData.email}
                        onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-10 px-3 py-2 border rounded-md"
                        disabled={clientSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={clientFormData.telefono}
                        onChange={(e) => setClientFormData({ ...clientFormData, telefono: e.target.value })}
                        placeholder="+54 11 1234-5678"
                        className="w-full pl-10 px-3 py-2 border rounded-md"
                        disabled={clientSubmitting}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={clientFormData.direccion}
                        onChange={(e) => setClientFormData({ ...clientFormData, direccion: e.target.value })}
                        placeholder="Calle, número, ciudad..."
                        className="w-full pl-10 px-3 py-2 border rounded-md"
                        disabled={clientSubmitting}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={clientFormData.notas}
                        onChange={(e) => setClientFormData({ ...clientFormData, notas: e.target.value })}
                        placeholder="Observaciones..."
                        rows="3"
                        className="w-full pl-10 px-3 py-2 border rounded-md"
                        disabled={clientSubmitting}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseClientModal} className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50" disabled={clientSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center gap-2" disabled={clientSubmitting}>
                    {clientSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasArray.map((venta) => (
              <tr key={venta.id || venta._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{venta.id}</div>
                  {venta.notas && (
                    <div className="text-xs text-gray-500 truncate max-w-xs">{venta.notas}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {venta.cliente_nombre || 'Cliente Casual'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(venta.fecha_venta || venta.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${venta.total?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${venta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                      venta.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                    {venta.estado || 'completada'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWhatsApp(venta)}
                      className="text-green-600 hover:text-green-900"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(venta)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Editar"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(venta.id || venta._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
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
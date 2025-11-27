// src/pages/admin/Stock.jsx
import { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Check,
  X as XIcon,
} from 'lucide-react';
import { stockAPI } from '../../services/api';


export default function Stock() {
  const [stock, setStock] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [pagination, setPagination] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    stock_id: null,
    comic_titulo: '',
    cantidad_actual: 0,
    ajuste: '',
    motivo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce search term (200ms)
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 200);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm]);

  // Load filtered data when filters change (not during initial load)
  useEffect(() => {
    if (!loading) {
      loadFilteredData();
    }
  }, [debouncedSearchTerm, filterStock, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      const [stockRes, summaryRes] = await Promise.all([
        stockAPI.getAllStock(params),
        stockAPI.getStockSummary(),
      ]);

      setStock(stockRes.data || []);
      setPagination(stockRes.pagination || null);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredData = async () => {
    try {
      setIsFiltering(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        filterStock: filterStock !== 'all' ? filterStock : undefined,
      };

      const [stockRes, summaryRes] = await Promise.all([
        stockAPI.getAllStock(params),
        stockAPI.getStockSummary(),
      ]);

      setStock(stockRes.data || []);
      setPagination(stockRes.pagination || null);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Error al filtrar stock:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleUpdateStock = async (stockId) => {
    if (!editValue || isNaN(editValue) || parseInt(editValue) < 0) {
      alert('Ingresa una cantidad válida (mayor o igual a 0)');
      return;
    }

    try {
      await stockAPI.updateStock(stockId, { cantidad_disponible: parseInt(editValue) });
      await loadFilteredData();
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      alert('Error al actualizar el stock');
      console.error(error);
    }
  };

  const handleOpenAdjustModal = (item) => {
    setAdjustData({
      stock_id: item.id,
      comic_titulo: item.titulo,
      cantidad_actual: item.cantidad_disponible,
      ajuste: '',
      motivo: '',
    });
    setShowAdjustModal(true);
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustData({
      stock_id: null,
      comic_titulo: '',
      cantidad_actual: 0,
      ajuste: '',
      motivo: '',
    });
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();

    if (!adjustData.ajuste || adjustData.ajuste === '0') {
      alert('El ajuste debe ser diferente de 0');
      return;
    }

    try {
      setSubmitting(true);
      await stockAPI.adjust(
        adjustData.stock_id,
        parseInt(adjustData.ajuste),
        adjustData.motivo || ''
      );
      await loadFilteredData();
      handleCloseAdjustModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al ajustar el stock');
    } finally {
      setSubmitting(false);
    }
  };

  // Since filtering is now done on the backend, we can use stock directly
  const filteredStock = stock;

  const getStockColor = (cantidad) => {
    if (cantidad === 0) return 'text-red-600 bg-red-50';
    if (cantidad < 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockBadge = (cantidad) => {
    if (cantidad === 0) return 'badge-danger';
    if (cantidad < 5) return 'badge-warning';
    return 'badge-success';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Stock
        </h1>
        <p className="text-gray-600">
          Administra el inventario de tu comiquería
        </p>
      </div>

      {/* Resumen de Stock */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-700 mb-1">
                  Total Items
                </p>
                <p className="text-3xl font-bold text-primary-900">
                  {summary.total_items}
                </p>
              </div>
              <Package className="w-12 h-12 text-primary-600 opacity-50" />
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">
                  Total Unidades
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {summary.total_unidades}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">
                  Bajo Stock
                </p>
                <p className="text-3xl font-bold text-yellow-900">
                  {summary.bajo_stock}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">
                  Sin Stock
                </p>
                <p className="text-3xl font-bold text-red-900">
                  {summary.sin_stock}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Búsqueda Mejorada */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o editorial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 pr-10"
            />
            {/* Indicador de búsqueda y botón limpiar */}
            {searchTerm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                )}
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Limpiar búsqueda"
                >
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
          {/* Contador de resultados */}
          {searchTerm && !isFiltering && pagination && (
            <div className="text-xs text-gray-500 mt-1">
              {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Filtro por Estado */}
        <div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="input pl-10"
            >
              <option value="all">Todos los estados</option>
              <option value="disponible">Disponible (5+)</option>
              <option value="bajo_stock">Bajo Stock (1-4)</option>
              <option value="sin_stock">Sin Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indicador de filtrado */}
      {isFiltering && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Filtrando...</span>
        </div>
      )}

      {/* Tabla de Stock */}
      {filteredStock.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-600">
            Intenta con otros filtros o búsqueda
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editorial
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStock.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Comic */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.titulo}
                        </p>
                        <p className="text-sm text-gray-500">
                          #{item.numero_edicion}
                        </p>
                      </div>
                    </td>

                    {/* Editorial */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.editorial_nombre}
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-green-600">
                        ${item.precio}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateStock(item.id);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditValue('');
                              }
                            }}
                          />
                          <button
                            onClick={() => handleUpdateStock(item.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue('');
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${getStockColor(
                              item.cantidad_disponible
                            )}`}
                          >
                            <Package className="w-4 h-4" />
                            {item.cantidad_disponible}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`badge ${getStockBadge(
                          item.cantidad_disponible
                        )}`}
                      >
                        {item.cantidad_disponible === 0
                          ? 'Sin stock'
                          : item.cantidad_disponible < 5
                            ? 'Bajo'
                            : 'Disponible'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId !== item.id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.cantidad_disponible);
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Actualizar cantidad"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                              title="Ajustar stock (+/-)"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación y Contador */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Contador */}
          <div className="text-sm text-gray-600">
            Mostrando{' '}
            <span className="font-bold text-primary-600">
              {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            de{' '}
            <span className="font-bold text-primary-600">
              {pagination.total}
            </span>{' '}
            items
          </div>

          {/* Controles de Paginación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
              className="btn btn-ghost disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-ghost disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ajuste */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={handleCloseAdjustModal}
            ></div>

            {/* Modal */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Ajustar Stock
                </h3>
                <button
                  onClick={handleCloseAdjustModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Info del comic */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-gray-900 mb-1">
                  {adjustData.comic_titulo}
                </p>
                <p className="text-sm text-gray-600">
                  Stock actual:{' '}
                  <span className="font-bold text-primary-600">
                    {adjustData.cantidad_actual}
                  </span>{' '}
                  unidades
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustData({ ...adjustData, ajuste: '-5' })
                      }
                      className="btn btn-ghost flex items-center gap-1"
                    >
                      <Minus className="w-4 h-4" />5
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustData({ ...adjustData, ajuste: '-1' })
                      }
                      className="btn btn-ghost flex items-center gap-1"
                    >
                      <Minus className="w-4 h-4" />1
                    </button>
                    <input
                      type="number"
                      required
                      value={adjustData.ajuste}
                      onChange={(e) =>
                        setAdjustData({ ...adjustData, ajuste: e.target.value })
                      }
                      placeholder="0"
                      className="input flex-1 text-center font-bold"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustData({ ...adjustData, ajuste: '+1' })
                      }
                      className="btn btn-ghost flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustData({ ...adjustData, ajuste: '+5' })
                      }
                      className="btn btn-ghost flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />5
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Usa números positivos para aumentar o negativos para
                    disminuir
                  </p>
                </div>

                {adjustData.ajuste && adjustData.ajuste !== '0' && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm text-primary-900">
                      Nuevo stock:{' '}
                      <span className="font-bold">
                        {adjustData.cantidad_actual + parseInt(adjustData.ajuste)}
                      </span>{' '}
                      unidades
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={adjustData.motivo}
                    onChange={(e) =>
                      setAdjustData({ ...adjustData, motivo: e.target.value })
                    }
                    placeholder="Ej: Venta, Devolución, Inventario..."
                    className="input"
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseAdjustModal}
                    className="flex-1 btn btn-ghost"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Ajustando...</span>
                      </>
                    ) : (
                      <span>Aplicar Ajuste</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
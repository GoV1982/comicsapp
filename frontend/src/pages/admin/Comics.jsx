// src/pages/admin/Comics.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
  Filter,
  Image as ImageIcon,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ImageOff,
} from 'lucide-react';
import { comicsAPI, editorialesAPI, googleSheetsAPI } from '../../services/api';
import LazyImage from '../../components/LazyImage';
import VirtualizedTable from '../../components/VirtualizedTable';
import DeleteFiltersModal from '../../components/DeleteFiltersModal';

export default function Comics() {
  const [comics, setComics] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [filterEditorial, setFilterEditorial] = useState('');
  const [filterSinImagen, setFilterSinImagen] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [imagenesRotas, setImagenesRotas] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [showSheetsMenu, setShowSheetsMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'titulo',
    direction: 'asc',
  });
  const [selectedComics, setSelectedComics] = useState(new Set());
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasPrevPage: false,
  });
  const [showDeleteFiltersModal, setShowDeleteFiltersModal] = useState(false);
  const [deletingFilters, setDeletingFilters] = useState(false);
  const [deleteFilters, setDeleteFilters] = useState({
    editorial_id: '',
    titulo: '',
    deleteAll: false,
  });

  const [formData, setFormData] = useState({
    titulo: '',
    numero_edicion: '',
    editorial_id: '',
    precio: '',
    genero: '',
    subgenero: '',
    imagen_url: '',
    descripcion: '',
    estado: 'Disponible',
  });

  const [generosDisponibles, setGenerosDisponibles] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Load genres on mount  
  useEffect(() => {
    const loadGeneros = async () => {
      try {
        const generosRes = await comicsAPI.getGeneros();
        setGenerosDisponibles(generosRes.data || []);
      } catch (error) {
        console.error('Error al cargar géneros:', error);
      }
    };
    loadGeneros();

    // Load initial data
    loadInitialData();
  }, []);

  // Debounce search term (200ms for fast response)
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

  // Effect to load filtered data when filters change (NOT initial load)
  useEffect(() => {
    if (!loading) { // Only filter if initial data is loaded
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    }
  }, [debouncedSearchTerm, filterGenero, filterEditorial, filterEstado, filterSinImagen]);

  // Client-side filtering for "Sin imagen" filter
  const filteredComics = useMemo(() => {
    if (!filterSinImagen) {
      return comics;
    }
    return comics.filter(comic =>
      !comic.imagen_url || imagenesRotas.has(comic.id)
    );
  }, [comics, filterSinImagen, imagenesRotas]);

  const loadInitialData = async (sortKey = sortConfig.key, sortDirection = sortConfig.direction) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        sort: sortKey,
        order: sortDirection,
      };

      const [comicsRes, editorialesRes] = await Promise.all([
        comicsAPI.getAllComics(params),
        editorialesAPI.getAllEditoriales(),
      ]);

      setComics(comicsRes.data || []);
      setPagination({
        currentPage: 1,
        totalPages: comicsRes.pagination?.totalPages || 1,
        totalItems: comicsRes.pagination?.totalItems || 0,
        itemsPerPage: 50,
        hasNextPage: comicsRes.pagination?.hasNextPage || false,
        hasPrevPage: false,
      });
      setLoadedPages(1);
      setEditoriales(editorialesRes.data || []);
      setImagenesRotas(new Set());
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredData = async (search = '', genero = '', editorial = '', sinImagen = false, estado = '', sortKey = sortConfig.key, sortDirection = sortConfig.direction) => {
    try {
      setIsFiltering(true);
      const params = {
        page: 1,
        limit: 50,
        search,
        genero,
        editorial,
        estado,
        sinImagen,
        sort: sortKey,
        order: sortDirection,
      };

      const comicsRes = await comicsAPI.getAllComics(params);

      setComics(comicsRes.data || []);
      setPagination({
        currentPage: 1,
        totalPages: comicsRes.pagination?.totalPages || 1,
        totalItems: comicsRes.pagination?.totalItems || 0,
        itemsPerPage: 50,
        hasNextPage: comicsRes.pagination?.hasNextPage || false,
        hasPrevPage: false,
      });
      setLoadedPages(1);
      setImagenesRotas(new Set());
    } catch (error) {
      console.error('Error al filtrar datos:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const loadData = async (page = 1, search = '', genero = '', editorial = '', sinImagen = false, estado = '', sortKey = sortConfig.key, sortDirection = sortConfig.direction) => {
    try {
      setIsFiltering(true);
      const params = {
        page,
        limit: 50,
        search,
        genero,
        editorial,
        estado,
        sinImagen,
        sort: sortKey,
        order: sortDirection,
      };

      const comicsRes = await comicsAPI.getAllComics(params);
      setComics(comicsRes.data || []);
      setPagination({
        currentPage: page,
        totalPages: comicsRes.pagination?.totalPages || 1,
        totalItems: comicsRes.pagination?.totalItems || 0,
        itemsPerPage: 50,
        hasNextPage: comicsRes.pagination?.hasNextPage || false,
        hasPrevPage: page > 1,
      });
      setImagenesRotas(new Set());
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setIsFiltering(false);
    }
  };

  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (isNextPageLoading) return;

    setIsNextPageLoading(true);
    try {
      const nextPage = loadedPages + 1;
      const params = {
        page: nextPage,
        limit: 50,
        search: debouncedSearchTerm,
        genero: filterGenero,
        editorial: filterEditorial,
        estado: filterEstado,
        sinImagen: filterSinImagen,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };

      const comicsRes = await comicsAPI.getAllComics(params);
      const newComics = comicsRes.data || [];

      setComics(prev => [...prev, ...newComics]);
      setHasNextPage(comicsRes.pagination?.hasNextPage || false);
      setLoadedPages(nextPage);
    } catch (error) {
      console.error('Error al cargar más datos:', error);
    } finally {
      setIsNextPageLoading(false);
    }
  }, [isNextPageLoading, loadedPages, debouncedSearchTerm, filterGenero, filterEditorial, filterEstado, filterSinImagen, sortConfig.key, sortConfig.direction]);

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado, key, direction);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-primary-600" /> : <ArrowDown className="w-4 h-4 text-primary-600" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  const handleImageError = (comicId) => {
    setImagenesRotas(prev => new Set([...prev, comicId]));
  };

  const isImageBroken = (comicId) => {
    return imagenesRotas.has(comicId);
  };

  const handleOpenModal = (comic = null) => {
    if (comic) {
      setEditingId(comic.id);
      setFormData({
        titulo: comic.titulo,
        numero_edicion: comic.numero_edicion,
        editorial_id: comic.editorial_id,
        precio: comic.precio,
        genero: comic.genero,
        subgenero: comic.subgenero || '',
        imagen_url: comic.imagen_url || '',
        descripcion: comic.descripcion || '',
        estado: comic.estado || 'Disponible',
      });
    } else {
      setEditingId(null);
      setFormData({
        titulo: '',
        numero_edicion: '',
        editorial_id: '',
        precio: '',
        genero: '',
        subgenero: '',
        imagen_url: '',
        descripcion: '',
        estado: 'Disponible',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      titulo: '',
      numero_edicion: '',
      editorial_id: '',
      precio: '',
      genero: '',
      subgenero: '',
      imagen_url: '',
      descripcion: '',
      estado: 'Disponible',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await comicsAPI.updateComic(editingId, formData);
      } else {
        await comicsAPI.createComic(formData);
      }
      handleCloseModal();
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    } catch (error) {
      console.error('Error al guardar comic:', error);
      setError(error.response?.data?.message || 'Error al guardar el comic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comic?')) {
      return;
    }

    try {
      await comicsAPI.deleteComic(id);
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    } catch (error) {
      console.error('Error al eliminar comic:', error);
      alert('Error al eliminar el comic: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSelectComic = (comicId) => {
    setSelectedComics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(comicId)) {
        newSet.delete(comicId);
      } else {
        newSet.add(comicId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedComics.size === filteredComics.length) {
      setSelectedComics(new Set());
    } else {
      setSelectedComics(new Set(filteredComics.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComics.size === 0) return;

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedComics.size} comics?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedComics).map((id) => comicsAPI.deleteComic(id))
      );
      setSelectedComics(new Set());
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    } catch (error) {
      console.error('Error al eliminar comics:', error);
      alert('Error al eliminar comics: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImportFromSheets = async () => {
    try {
      const replaceExisting = window.confirm(
        '¿Deseas actualizar los cómics existentes que tengan el mismo título?\n\n' +
        'Aceptar: Actualiza datos y stock de cómics existentes.\n' +
        'Cancelar: Solo agrega cómics nuevos, ignorando duplicados.'
      );

      setSheetsLoading(true);
      setShowSheetsMenu(false);

      const result = await googleSheetsAPI.importComics({
        sheetName: 'Comics',
        replaceExisting
      });

      alert(
        `Importación completada:\n` +
        `- Importados/Actualizados: ${result.imported?.length || 0}\n` +
        `- Saltados: ${result.skipped?.length || 0}\n` +
        `- Errores: ${result.errors?.length || 0}`
      );
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    } catch (error) {
      console.error('Error al importar desde Sheets:', error);
      alert('Error al importar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleExportToSheets = async () => {
    try {
      const mode = window.confirm(
        '¿Cómo deseas exportar?\n\n' +
        'Aceptar: MODO REPLACE - Borra todo en Sheets y escribe la base de datos actual (Ideal para respaldos).\n' +
        'Cancelar: MODO UPDATE - Actualiza filas existentes y agrega nuevas (Mantiene otras filas no relacionadas).'
      ) ? 'replace' : 'update';

      setSheetsLoading(true);
      setShowSheetsMenu(false);

      let comicsToExport = [];

      if (selectedComics.size > 0) {
        // Exportar solo seleccionados (de la vista actual)
        comicsToExport = comics.filter(c => selectedComics.has(c.id));
      } else {
        // Exportar todo (con o sin filtros)
        // Necesitamos traer todos los datos del backend, ignorando paginación
        const params = {
          limit: 100000, // Un número suficientemente grande para traer todo
          search: debouncedSearchTerm,
          genero: filterGenero,
          editorial: filterEditorial,
          estado: filterEstado,
          sinImagen: filterSinImagen,
          sort: sortConfig.key,
          order: sortConfig.direction,
        };
        const response = await comicsAPI.getAllComics(params);
        comicsToExport = response.data || [];
      }

      await googleSheetsAPI.exportComics(comicsToExport, {
        sheetName: 'Comics',
        mode
      });

      alert(`Exportación completada en modo ${mode.toUpperCase()}. Se exportaron ${comicsToExport.length} registros.`);
    } catch (error) {
      console.error('Error al exportar a Sheets:', error);
      alert('Error al exportar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleSyncWithSheets = async () => {
    try {
      const strategy = window.confirm(
        'Selecciona la estrategia de sincronización:\n\n' +
        'Aceptar: BIDIRECCIONAL INTELIGENTE - Importa cambios de Sheets y luego exporta actualizaciones de DB.\n' +
        'Cancelar: RESPALDO (DB -> Sheets) - Sobrescribe Sheets con los datos actuales de la DB.'
      ) ? 'two-way-smart' : 'db-to-sheets';

      setSheetsLoading(true);
      setShowSheetsMenu(false);

      await googleSheetsAPI.syncComics({
        sheetName: 'Comics',
        strategy,
        replaceOnConflict: true
      });

      alert(`Sincronización (${strategy}) completada exitosamente.`);
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
    } catch (error) {
      console.error('Error al sincronizar con Sheets:', error);
      alert('Error al sincronizar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      loadData(
        pagination.currentPage + 1,
        debouncedSearchTerm,
        filterGenero,
        filterEditorial,
        filterSinImagen,
        filterEstado
      );
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      loadData(
        pagination.currentPage - 1,
        debouncedSearchTerm,
        filterGenero,
        filterEditorial,
        filterSinImagen,
        filterEstado
      );
    }
  };

  const handleConfirmDeleteFilters = async (filters) => {
    try {
      setDeletingFilters(true);
      const result = await comicsAPI.deleteByFilters(filters);
      setShowDeleteFiltersModal(false);
      loadFilteredData(debouncedSearchTerm, filterGenero, filterEditorial, filterSinImagen, filterEstado);
      alert(result.message);
    } catch (error) {
      console.error('Error al eliminar comics por filtros:', error);
      alert('Error al eliminar comics: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingFilters(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando comics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comics</h1>
          <p className="text-gray-600">Gestiona el catálogo de tu comiquería</p>
        </div>
        <div className="flex gap-2">
          {/* Google Sheets Actions */}
          <div className="relative">
            <button
              onClick={() => setShowSheetsMenu(!showSheetsMenu)}
              className="btn btn-outline flex items-center gap-2"
              disabled={sheetsLoading}
            >
              {sheetsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 8c0 1.5-.5 3-1.5 4.5L12 7.5 9 12c-1-1.5-1.5-3-1.5-4.5s.5-3 1.5-4.5L12 7.5l3-4c1 1.5 1.5 3 1.5 4.5z" />
                  <path d="M12 2.5L9 7.5 6 2.5H2v19h20V2.5h-4l-3 5-3-5z" />
                </svg>
              )}
              <span>Google Sheets</span>
            </button>
            {showSheetsMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <button
                    onClick={handleImportFromSheets}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Importar desde Sheets
                  </button>
                  <button
                    onClick={handleExportToSheets}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Exportar a Sheets
                  </button>
                  <button
                    onClick={handleSyncWithSheets}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sincronizar
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedComics.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Eliminar ({selectedComics.size})</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteFiltersModal(true)}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            <span>Eliminar por Filtros</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Comic</span>
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Búsqueda Mejorada */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comics..."
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
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
          {/* Contador de resultados */}
          {searchTerm && !isFiltering && (
            <div className="text-xs text-gray-500 mt-1">
              {pagination.totalItems} resultado{pagination.totalItems !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Filtro por Editorial */}
        < div >
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterEditorial}
              onChange={(e) => setFilterEditorial(e.target.value)}
              className="input pl-10"
            >
              <option value="">Todas las editoriales</option>
              {editoriales.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.nombre}
                </option>
              ))}
            </select>
          </div>
        </div >

        {/* Filtro por Género */}
        < div >
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterGenero}
              onChange={(e) => setFilterGenero(e.target.value)}
              className="input pl-10"
            >
              <option value="">Todos los géneros</option>
              {generosDisponibles.map((gen) => (
                <option key={gen} value={gen}>
                  {gen}
                </option>
              ))}
            </select>
          </div>
        </div >

        {/* Filtro por Estado */}
        < div >
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="input pl-10"
            >
              <option value="">Todos los estados</option>
              <option value="En stock">En stock</option>
              <option value="A pedido">A pedido</option>
              <option value="Agotado">Agotado</option>
              <option value="Novedad">Novedad</option>
              <option value="Consultar">Consultar</option>
            </select>
          </div>
        </div >

        {/* Filtro Sin Imagen */}
        < div >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterSinImagen}
              onChange={(e) => setFilterSinImagen(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <ImageOff className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Sin imagen</span>
          </label>
        </div >
      </div >

      {/* Indicador de filtrado */}
      {
        isFiltering && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Buscando...</span>
          </div>
        )
      }

      {/* Lista de Comics */}
      {
        filteredComics.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {comics.length === 0
                ? 'No hay comics registrados'
                : 'No se encontraron resultados'}
            </h3>
            <p className="text-gray-600 mb-4">
              {comics.length === 0
                ? 'Comienza agregando tu primer comic'
                : 'Intenta con otros filtros o búsqueda'}
            </p>
            {comics.length === 0 && (
              <button
                onClick={() => handleOpenModal()}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Comic</span>
              </button>
            )}
          </div>
        ) : (
          <VirtualizedTable
            comics={filteredComics}
            hasNextPage={hasNextPage}
            isNextPageLoading={isNextPageLoading}
            loadMoreItems={loadMoreItems}
            sortConfig={sortConfig}
            handleSort={handleSort}
            selectedComics={selectedComics}
            handleSelectComic={handleSelectComic}
            handleSelectAll={handleSelectAll}
            handleOpenModal={handleOpenModal}
            handleDelete={handleDelete}
            imagenesRotas={imagenesRotas}
            handleImageError={handleImageError}
            itemCount={filteredComics.length}
            itemSize={80}
          />
        )
      }

      {/* Contador y Paginación */}
      {
        comics.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">
                Mostrando{' '}
                <span className="font-bold text-primary-600">
                  {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                de{' '}
                <span className="font-bold text-primary-600">
                  {pagination.totalItems}
                </span>{' '}
                comics
                {filterSinImagen && (
                  <span className="text-orange-600 font-medium"> (sin imagen)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Filters Modal */}
      {
        showDeleteFiltersModal && (
          <DeleteFiltersModal
            isOpen={showDeleteFiltersModal}
            onClose={() => setShowDeleteFiltersModal(false)}
            editoriales={editoriales}
            onConfirm={handleConfirmDeleteFilters}
            loading={deletingFilters}
          />
        )
      }

      {/* Modal */}
      {
        showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div
                className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
                onClick={handleCloseModal}
              ></div>

              {/* Modal */}
              <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Editar Comic' : 'Nuevo Comic'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">{error}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Título */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData({ ...formData, titulo: e.target.value })
                        }
                        placeholder="Ej: The Amazing Spider-Man"
                        className="input"
                        disabled={submitting}
                      />
                    </div>

                    {/* Número de Edición */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Edición *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.numero_edicion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_edicion: e.target.value,
                          })
                        }
                        placeholder="Ej: 1"
                        className="input"
                        disabled={submitting}
                      />
                    </div>

                    {/* Editorial */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Editorial *
                      </label>
                      <select
                        required
                        value={formData.editorial_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            editorial_id: e.target.value,
                          })
                        }
                        className="input"
                        disabled={submitting}
                      >
                        <option value="">Seleccionar editorial</option>
                        {editoriales.map((ed) => (
                          <option key={ed.id} value={ed.id}>
                            {ed.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.precio}
                        onChange={(e) =>
                          setFormData({ ...formData, precio: e.target.value })
                        }
                        placeholder="0.00"
                        className="input"
                        disabled={submitting}
                      />
                    </div>

                    {/* Género */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género *
                      </label>
                      <select
                        required
                        value={formData.genero}
                        onChange={(e) =>
                          setFormData({ ...formData, genero: e.target.value })
                        }
                        className="input"
                        disabled={submitting}
                      >
                        <option value="">Seleccionar género</option>
                        {generosDisponibles.map((gen) => (
                          <option key={gen} value={gen}>
                            {gen}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <select
                        required
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({ ...formData, estado: e.target.value })
                        }
                        className="input"
                        disabled={submitting}
                      >
                        <option value="">Seleccionar estado</option>
                        <option value="En stock">En stock</option>
                        <option value="A pedido">A pedido</option>
                        <option value="Agotado">Agotado</option>
                        <option value="Novedad">Novedad</option>
                        <option value="Consultar">Consultar</option>
                      </select>
                    </div>

                    {/* Subgénero */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subgénero (opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.subgenero}
                        onChange={(e) =>
                          setFormData({ ...formData, subgenero: e.target.value })
                        }
                        placeholder="Ej: Acción, Aventura..."
                        className="input"
                        disabled={submitting}
                      />
                    </div>

                    {/* URL de Imagen */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de Imagen (opcional)
                      </label>
                      <input
                        type="url"
                        value={formData.imagen_url}
                        onChange={(e) =>
                          setFormData({ ...formData, imagen_url: e.target.value })
                        }
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="input"
                        disabled={submitting}
                      />
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Descripción del comic..."
                        rows="3"
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
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
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>{editingId ? 'Actualizar' : 'Crear'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

// src/pages/admin/Comics.jsx
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { comicsAPI, editorialesAPI } from '../../services/api';

export default function Comics() {
  const [comics, setComics] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [filterEditorial, setFilterEditorial] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    numero_edicion: '',
    editorial_id: '',
    precio: '',
    genero: '',
    subgenero: '',
    imagen_url: '',
    descripcion: '',
  });

  const generosDisponibles = [
    'Superhéroes',
    'Manga',
    'Ciencia Ficción',
    'Fantasía',
    'Terror',
    'Aventura',
    'Drama',
    'Comedia',
    'Romance',
    'Acción',
    'Otro',
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comicsRes, editorialesRes] = await Promise.all([
        comicsAPI.getAll(),
        editorialesAPI.getAll(),
      ]);
      setComics(comicsRes.data || []);
      setEditoriales(editorialesRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
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
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        editorial_id: parseInt(formData.editorial_id),
        precio: parseFloat(formData.precio),
      };

      if (editingId) {
        await comicsAPI.update(editingId, data);
      } else {
        await comicsAPI.create(data);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar el comic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
      return;
    }

    try {
      await comicsAPI.delete(id);
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar el comic';
      alert(message);
    }
  };

  const filteredComics = comics.filter((comic) => {
    const matchSearch =
      comic.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.numero_edicion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGenero = !filterGenero || comic.genero === filterGenero;
    const matchEditorial =
      !filterEditorial || comic.editorial_id === parseInt(filterEditorial);
    return matchSearch && matchGenero && matchEditorial;
  });

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
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Comic</span>
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Filtro por Editorial */}
        <div>
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
        </div>

        {/* Filtro por Género */}
        <div>
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
        </div>
      </div>

      {/* Lista de Comics */}
      {filteredComics.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredComics.map((comic, index) => (
            <div
              key={comic.id}
              className="card-hover overflow-hidden p-0 fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Imagen */}
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {comic.imagen_url ? (
                  <img
                    src={comic.imagen_url}
                    alt={comic.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML =
                        '<div class="flex items-center justify-center h-full"><svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                    {comic.titulo}
                  </h3>
                  <p className="text-sm text-gray-500">
                    #{comic.numero_edicion} • {comic.editorial_nombre}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-bold text-green-600">
                      ${comic.precio}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span
                      className={`font-semibold ${
                        comic.cantidad_disponible > 5
                          ? 'text-green-600'
                          : comic.cantidad_disponible > 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      <Package className="w-4 h-4 inline mr-1" />
                      {comic.cantidad_disponible || 0}
                    </span>
                  </div>
                  <div>
                    <span className="badge badge-primary">{comic.genero}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenModal(comic)}
                    className="flex-1 btn btn-ghost flex items-center justify-center gap-2 text-sm py-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(comic.id, comic.titulo)}
                    className="flex-1 btn text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm py-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {comics.length > 0 && (
        <div className="card text-center">
          <p className="text-gray-600">
            Mostrando:{' '}
            <span className="font-bold text-primary-600">
              {filteredComics.length}
            </span>
            {filteredComics.length !== comics.length && (
              <span className="text-gray-500"> de {comics.length}</span>
            )}{' '}
            comics
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
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
      )}
    </div>
  );
}
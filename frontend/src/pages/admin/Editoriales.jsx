// src/pages/admin/Editoriales.jsx
import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { editorialesAPI } from '../../services/api';

export default function Editoriales() {
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEditoriales();
  }, []);

  const loadEditoriales = async () => {
    try {
      setLoading(true);
      const response = await editorialesAPI.getAllEditoriales();
      setEditoriales(response.data || []);
    } catch (error) {
      console.error('Error al cargar editoriales:', error);
      setError('Error al cargar las editoriales');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (editorial = null) => {
    if (editorial) {
      setEditingId(editorial.id);
      setFormData({ nombre: editorial.nombre });
    } else {
      setEditingId(null);
      setFormData({ nombre: '' });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nombre: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingId) {
        await editorialesAPI.update(editingId, formData);
      } else {
        await editorialesAPI.create(formData);
      }
      await loadEditoriales();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la editorial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la editorial "${nombre}"?`)) {
      return;
    }

    try {
      await editorialesAPI.delete(id);
      await loadEditoriales();
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar la editorial';
      alert(message);
    }
  };

  const filteredEditoriales = editoriales.filter((editorial) =>
    editorial.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando editoriales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editoriales</h1>
          <p className="text-gray-600">
            Gestiona las editoriales de tu catálogo
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Editorial</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar editoriales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Lista de Editoriales */}
      {filteredEditoriales.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {editoriales.length === 0
              ? 'No hay editoriales registradas'
              : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600 mb-4">
            {editoriales.length === 0
              ? 'Comienza agregando tu primera editorial'
              : 'Intenta con otro término de búsqueda'}
          </p>
          {editoriales.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Editorial</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEditoriales.map((editorial, index) => (
            <div
              key={editorial.id}
              className="card-hover fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{editorial.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      ID: {editorial.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenModal(editorial)}
                  className="flex-1 btn btn-ghost flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(editorial.id, editorial.nombre)}
                  className="flex-1 btn text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {editoriales.length > 0 && (
        <div className="card text-center">
          <p className="text-gray-600">
            Total de editoriales:{' '}
            <span className="font-bold text-primary-600">
              {filteredEditoriales.length}
            </span>
            {searchTerm && filteredEditoriales.length !== editoriales.length && (
              <span className="text-gray-500"> de {editoriales.length}</span>
            )}
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
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Editar Editorial' : 'Nueva Editorial'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Editorial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Marvel Comics"
                    className="input"
                    disabled={submitting}
                    autoFocus
                  />
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
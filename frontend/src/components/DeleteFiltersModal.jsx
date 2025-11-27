import { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

export default function DeleteFiltersModal({
  isOpen,
  onClose,
  editoriales,
  onConfirm,
  loading
}) {
  const [filters, setFilters] = useState({
    editorial_id: '',
    titulo: '',
    deleteAll: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(filters);
  };

  const handleClose = () => {
    setFilters({
      editorial_id: '',
      titulo: '',
      deleteAll: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Eliminar Comics por Filtros
            </h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer.
              Los comics eliminados se perderán permanentemente.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Delete All Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="deleteAll"
                checked={filters.deleteAll}
                onChange={(e) => setFilters({ ...filters, deleteAll: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="deleteAll" className="text-sm font-medium text-yellow-800">
                Eliminar TODOS los comics de la base de datos
              </label>
            </div>

            {!filters.deleteAll && (
              <>
                {/* Editorial Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Editorial
                  </label>
                  <select
                    value={filters.editorial_id}
                    onChange={(e) => setFilters({ ...filters, editorial_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Todas las editoriales</option>
                    {editoriales.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Título (contiene)
                  </label>
                  <input
                    type="text"
                    value={filters.titulo}
                    onChange={(e) => setFilters({ ...filters, titulo: e.target.value })}
                    placeholder="Ej: Batman, Spider-Man..."
                    className="input"
                  />
                </div>
              </>
            )}

            {/* Preview */}
            {!filters.deleteAll && (filters.editorial_id || filters.titulo) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Vista previa:</strong> Se eliminarán comics que coincidan con:
                  {filters.editorial_id && (
                    <span className="block">
                      • Editorial: {editoriales.find(ed => ed.id.toString() === filters.editorial_id)?.nombre}
                    </span>
                  )}
                  {filters.titulo && (
                    <span className="block">
                      • Título contiene: "{filters.titulo}"
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn btn-ghost"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                disabled={loading || (!filters.deleteAll && !filters.editorial_id && !filters.titulo)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Eliminar Comics</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

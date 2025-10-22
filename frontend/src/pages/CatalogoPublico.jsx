// src/pages/CatalogoPublico.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  Building2,
  ShoppingCart,
  LogIn,
  Package,
  X,
  Loader2,
} from 'lucide-react';
import { publicAPI } from '../services/api';

export default function CatalogoPublico() {
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [filterEditorial, setFilterEditorial] = useState('');
  const [selectedComic, setSelectedComic] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comicsRes, editorialesRes, generosRes] = await Promise.all([
        publicAPI.getCatalogo(),
        publicAPI.getEditoriales(),
        publicAPI.getGeneros(),
      ]);
      setComics(comicsRes.data || []);
      setEditoriales(editorialesRes.data || []);
      setGeneros(generosRes.data || []);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (comic) => {
    setSelectedComic(comic);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedComic(null);
  };

  const filteredComics = comics.filter((comic) => {
    const matchSearch =
      comic.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.numero_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.editorial_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGenero = !filterGenero || comic.genero === filterGenero;
    const matchEditorial =
      !filterEditorial || comic.editorial_nombre === filterEditorial;
    return matchSearch && matchGenero && matchEditorial;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Comiquería</h1>
                <p className="text-xs text-gray-500">Catálogo Online</p>
              </div>
            </div>

            {/* Botón Admin */}
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Explora Nuestro Catálogo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre los mejores comics y mangas disponibles en nuestra tienda
          </p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Búsqueda */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar comics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filtro Editorial */}
          <div>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterEditorial}
                onChange={(e) => setFilterEditorial(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm appearance-none"
              >
                <option value="">Todas las editoriales</option>
                {editoriales.map((ed) => (
                  <option key={ed.id} value={ed.nombre}>
                    {ed.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro Género */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterGenero}
                onChange={(e) => setFilterGenero(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm appearance-none"
              >
                <option value="">Todos los géneros</option>
                {generos.map((gen) => (
                  <option key={gen} value={gen}>
                    {gen}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contador de Resultados */}
        {comics.length > 0 && (
          <div className="text-center mb-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-gray-600">
              {filteredComics.length === comics.length ? (
                <>
                  Mostrando <span className="font-bold text-primary-600">{comics.length}</span> comics disponibles
                </>
              ) : (
                <>
                  Mostrando <span className="font-bold text-primary-600">{filteredComics.length}</span> de {comics.length} comics
                </>
              )}
            </p>
          </div>
        )}

        {/* Grid de Comics */}
        {filteredComics.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {comics.length === 0
                ? 'Catálogo en construcción'
                : 'No se encontraron resultados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {comics.length === 0
                ? 'Estamos preparando nuestro catálogo. Vuelve pronto.'
                : 'Intenta con otros filtros o búsqueda'}
            </p>
            {(searchTerm || filterGenero || filterEditorial) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGenero('');
                  setFilterEditorial('');
                }}
                className="btn btn-primary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredComics.map((comic, index) => (
              <div
                key={comic.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Imagen */}
                <div className="h-72 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative group">
                  {comic.imagen_url ? (
                    <img
                      src={comic.imagen_url}
                      alt={comic.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="w-20 h-20 text-gray-400" />
                  )}
                  
                  {/* Badge de Stock */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <Package className="w-3 h-3" />
                      {comic.cantidad_disponible} disponibles
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5">
                  {/* Género */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {comic.genero}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                    {comic.titulo}
                  </h3>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Edición:</span> #{comic.numero_edicion}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Editorial:</span> {comic.editorial_nombre}
                    </p>
                  </div>

                  {/* Precio */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-2xl font-bold text-primary-600">
                      ${comic.precio}
                    </span>
                    <button
                      onClick={() => handleViewDetails(comic)}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Ver más
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Comiquería</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Sistema de Gestión de Comiquería v1.0
            </p>
            <p className="text-xs text-gray-500">
              © 2024 Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Detalles */}
      {showModal && selectedComic && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

            {/* Modal */}
            <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl fade-in">
              <div className="relative">
                {/* Botón Cerrar */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>

                {/* Contenido */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Imagen */}
                  <div className="h-96 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {selectedComic.imagen_url ? (
                      <img
                        src={selectedComic.imagen_url}
                        alt={selectedComic.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-24 h-24 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-8">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full mb-4">
                        {selectedComic.genero}
                      </span>
                      {selectedComic.subgenero && (
                        <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-semibold rounded-full ml-2">
                          {selectedComic.subgenero}
                        </span>
                      )}
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {selectedComic.titulo}
                    </h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">Edición:</span>
                        <span>#{selectedComic.numero_edicion}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">Editorial:</span>
                        <span>{selectedComic.editorial_nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">Stock:</span>
                        <span className="font-bold text-green-600">
                          {selectedComic.cantidad_disponible} disponibles
                        </span>
                      </div>
                    </div>

                    {selectedComic.descripcion && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Descripción
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {selectedComic.descripcion}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Precio</p>
                        <p className="text-3xl font-bold text-primary-600">
                          ${selectedComic.precio}
                        </p>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-lg">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Consultar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
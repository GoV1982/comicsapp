// src/pages/CatalogoCompleto.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  Building2,
  ShoppingCart,
  LogIn,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  ArrowUpDown,
  User,
  Heart,
} from 'lucide-react';
import { publicAPI, configuracionAPI, reviewsAPI } from '../services/api';
import LazyImage from '../components/LazyImage';
import StarRating from '../components/StarRating';
import CarritoModal from '../components/CarritoModal';
import { useCarrito } from '../contexts/CarritoContext';
import { useAuth } from '../contexts/AuthContext';

export default function CatalogoCompleto() {
  const navigate = useNavigate();
  const { isClienteAuthenticated } = useAuth();
  const { cantidadItems, addToCarrito } = useCarrito();

  const [comics, setComics] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [filterEditorial, setFilterEditorial] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [sortBy, setSortBy] = useState('titulo-asc');
  const [selectedComic, setSelectedComic] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCarritoModal, setShowCarritoModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ puntuacion: 0, comentario: '' });

  const availableStatuses = ['Disponible', 'Novedades', 'Reedición'];

  useEffect(() => {
    loadData();
    if (isClienteAuthenticated) {
      loadFavorites();
    }
  }, [isClienteAuthenticated]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGenero, filterEditorial, filterEstado, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comicsRes, editorialesRes, generosRes] = await Promise.all([
        publicAPI.getAllPublicItems(),  // Usar getAllPublicItems para obtener TODO el catálogo
        publicAPI.getEditoriales(),
        publicAPI.getGeneros(),
      ]);
      setComics(comicsRes.data || []);
      setEditoriales(editorialesRes.data || []);
      setGeneros(generosRes || []);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const response = await configuracionAPI.getTitulosFavoritos();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadReviews = async (comicId) => {
    try {
      setLoadingReviews(true);
      const [reviewsRes, userReviewRes] = await Promise.all([
        reviewsAPI.getReviews(comicId),
        isClienteAuthenticated ? reviewsAPI.getUserReview(comicId) : Promise.resolve({ data: null })
      ]);

      setReviews(reviewsRes.data || []);
      setUserReview(userReviewRes.data || null);

      if (userReviewRes.data) {
        setReviewForm({
          puntuacion: userReviewRes.data.puntuacion,
          comentario: userReviewRes.data.comentario || ''
        });
      } else {
        setReviewForm({ puntuacion: 0, comentario: '' });
      }
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isClienteAuthenticated) return navigate('/login-cliente');

    try {
      await reviewsAPI.addReview({
        comicId: selectedComic.id,
        ...reviewForm
      });

      loadReviews(selectedComic.id);
      loadData();
    } catch (error) {
      console.error('Error al enviar reseña:', error);
    }
  };

  const handleReviewDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar tu reseña?')) return;

    try {
      await reviewsAPI.deleteReview(selectedComic.id);
      loadReviews(selectedComic.id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
    }
  };

  const handleViewDetails = (comic) => {
    setSelectedComic(comic);
    setShowModal(true);
    loadReviews(comic.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedComic(null);
  };

  const handleAddToCart = async (comic) => {
    setAddingToCart(comic.id);
    try {
      const result = await addToCarrito(comic.id, 1);
      if (result.success) {
        console.log('Comic agregado al carrito:', result);
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFavorite = async (comicId) => {
    try {
      const isFavorite = favorites.some(fav => fav.id === comicId);
      if (isFavorite) {
        await configuracionAPI.removeTituloFavorito(comicId);
        setFavorites(favorites.filter(fav => fav.id !== comicId));
      } else {
        await configuracionAPI.addTituloFavorito(comicId);
        setFavorites([...favorites, { id: comicId }]);
      }
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
    }
  };



  // Filter out "Agotado" comics from the start
  const availableComics = comics.filter((comic) => (comic.estado || 'Disponible') !== 'Agotado');

  const filteredComics = availableComics.filter((comic) => {
    const matchSearch =
      comic.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.numero_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.editorial_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGenero = !filterGenero || comic.genero === filterGenero;
    const matchEditorial =
      !filterEditorial || comic.editorial_nombre === filterEditorial;
    const matchEstado = !filterEstado || (comic.estado || 'Disponible') === filterEstado;
    return matchSearch && matchGenero && matchEditorial && matchEstado;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'titulo-asc':
        return a.titulo.localeCompare(b.titulo);
      case 'titulo-desc':
        return b.titulo.localeCompare(a.titulo);
      case 'precio-asc':
        return a.precio - b.precio;
      case 'precio-desc':
        return b.precio - a.precio;
      case 'editorial-asc':
        return a.editorial_nombre.localeCompare(b.editorial_nombre);
      case 'editorial-desc':
        return b.editorial_nombre.localeCompare(a.editorial_nombre);
      default:
        return 0;
    }
  });



  // Pagination logic
  const totalPages = Math.ceil(filteredComics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComics = filteredComics.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                <p className="text-xs text-gray-500">Catálogo Completo</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Novedades</span>
              </Link>
              <button
                onClick={() => setShowCarritoModal(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Carrito</span>
                {cantidadItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cantidadItems}
                  </span>
                )}
              </button>
              {isClienteAuthenticated ? (
                <Link
                  to="/perfil"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Mi Cuenta</span>
                </Link>
              ) : (
                <Link
                  to="/login-cliente"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Catálogo Completo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora todo nuestro catálogo de comics y mangas disponibles
          </p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 fade-in" style={{ animationDelay: '0.1s' }}>
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

          {/* Ordenar */}
          <div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm appearance-none"
              >
                <option value="titulo-asc">Título A-Z</option>
                <option value="titulo-desc">Título Z-A</option>
                <option value="precio-asc">Precio menor a mayor</option>
                <option value="precio-desc">Precio mayor a menor</option>
                <option value="editorial-asc">Editorial A-Z</option>
                <option value="editorial-desc">Editorial Z-A</option>
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
                  Mostrando <span className="font-bold text-primary-600">{startIndex + 1}-{Math.min(endIndex, filteredComics.length)}</span> de {comics.length} comics disponibles
                </>
              ) : (
                <>
                  Mostrando <span className="font-bold text-primary-600">{startIndex + 1}-{Math.min(endIndex, filteredComics.length)}</span> de {filteredComics.length} comics filtrados (total: {comics.length})
                </>
              )}
            </p>
          </div>
        )}

        {/* Comics Grid */}
        {filteredComics.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta con otros filtros o búsqueda
            </p>
            {(searchTerm || filterGenero || filterEditorial || filterEstado || sortBy !== 'titulo-asc') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGenero('');
                  setFilterEditorial('');
                  setFilterEstado('');
                  setSortBy('titulo-asc');
                }}
                className="btn btn-primary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
              {currentComics.map((comic, index) => (
                <div
                  key={comic.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Imagen */}
                  <div className="h-72 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {comic.imagen_url ? (
                      <LazyImage
                        src={comic.imagen_url}
                        alt={comic.titulo}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-20 h-20 text-gray-400" />
                    )}

                    {/* Badge de Estado */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-white text-xs font-bold rounded-full shadow-lg ${comic.estado === 'Novedades' ? 'bg-blue-500' :
                        comic.estado === 'Reedición' ? 'bg-purple-500' :
                          comic.estado === 'Disponible' ? 'bg-green-500' :
                            'bg-gray-500'
                        }`}>
                        {comic.estado || 'Disponible'}
                      </span>
                    </div>

                    {/* Heart Button */}
                    {isClienteAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(comic.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${favorites.some(fav => fav.id === comic.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400'
                            }`}
                        />
                      </button>
                    )}
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

                    <div className="mb-3">
                      <StarRating
                        rating={comic.promedio_puntuacion}
                        count={comic.total_reviews}
                        showCount={true}
                        size="sm"
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
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

            {/* Paginación y Contador */}
            {totalPages > 1 && (
              <div className="card mt-12 mb-8">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">
                    Mostrando{' '}
                    <span className="font-bold text-primary-600">
                      {startIndex + 1}-{Math.min(endIndex, filteredComics.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-bold text-primary-600">
                      {filteredComics.length}
                    </span>{' '}
                    comics
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>

                    <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo y Descripción */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Comiquería</h3>
                  <p className="text-sm text-gray-400">Catálogo Online</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Tu tienda especializada en comics y mangas. Descubre las mejores historias del mundo del cómic con nosotros.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Enlaces Rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Novedades
                  </Link>
                </li>
                <li>
                  <Link to="/catalogo-completo" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Catálogo Completo
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Editoriales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Géneros
                  </a>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span>Calle Ficticia 123, Ciudad</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <span>info@comiqueria.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Línea Divisoria */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2024 Comiquería. Todos los derechos reservados.
              </p>
              <p className="text-sm text-gray-400 mt-2 md:mt-0">
                Sistema de Gestión de Comiquería v1.0
              </p>
            </div>
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
                      <LazyImage
                        src={selectedComic.imagen_url}
                        alt={selectedComic.titulo}
                        className="w-full h-full object-contain"
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
                    </div>

                    {selectedComic.descripcion && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Descripción
                        </h3>
                        <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {selectedComic.descripcion}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-200">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Precio</p>
                        <p className="text-3xl font-bold text-primary-600">
                          ${selectedComic.precio}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-lg">
                          <Mail className="w-5 h-5" />
                          <span>Consultar</span>
                        </button>
                        <button
                          onClick={() => handleAddToCart(selectedComic)}
                          disabled={addingToCart === selectedComic.id}
                          className="flex items-center gap-2 px-3 py-1 bg-secondary-600 text-white font-medium rounded-xl hover:bg-secondary-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToCart === selectedComic.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-5 h-5" />
                          )}
                          <span>
                            {addingToCart === selectedComic.id ? 'Agregando...' : 'Agregar al Carrito'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Sección de Reseñas */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Reseñas y Opiniones</h3>

                      {/* Formulario de Reseña */}
                      {isClienteAuthenticated ? (
                        <form onSubmit={handleReviewSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Puntuación</label>
                            <StarRating
                              rating={reviewForm.puntuacion}
                              interactive={true}
                              onChange={(val) => setReviewForm(prev => ({ ...prev, puntuacion: val }))}
                              size="lg"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Opinión</label>
                            <textarea
                              value={reviewForm.comentario}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, comentario: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              rows="2"
                              placeholder="¿Qué te pareció este cómic?"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            {userReview && (
                              <button
                                type="button"
                                onClick={handleReviewDelete}
                                className="text-red-600 text-sm hover:underline"
                              >
                                Eliminar mi reseña
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={reviewForm.puntuacion === 0}
                              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                              {userReview ? 'Actualizar' : 'Publicar'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-sm text-gray-600 mb-2">Inicia sesión para dejar tu opinión</p>
                          <Link to="/login-cliente" className="text-primary-600 font-medium hover:underline">
                            Iniciar Sesión
                          </Link>
                        </div>
                      )}

                      {/* Lista de Reseñas */}
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {loadingReviews ? (
                          <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></div>
                        ) : reviews.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center italic">Sé el primero en opinar sobre este cómic.</p>
                        ) : (
                          reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-900 text-sm">{review.cliente_nombre}</span>
                                <span className="text-xs text-gray-500">{new Date(review.fecha_creacion).toLocaleDateString()}</span>
                              </div>
                              <StarRating rating={review.puntuacion} size="sm" />
                              {review.comentario && (
                                <p className="text-gray-600 text-sm mt-1">{review.comentario}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Carrito */}
      <CarritoModal
        isOpen={showCarritoModal}
        onClose={() => setShowCarritoModal(false)}
      />
    </div>
  );
}

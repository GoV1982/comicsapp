import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  BookOpen,
  LogIn,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { publicAPI } from '../services/api';

export default function ImageChecker() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBrokenOnly, setShowBrokenOnly] = useState(false);
  const [imageStatuses, setImageStatuses] = useState({});
  const [checkingImages, setCheckingImages] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState({ checked: 0, total: 0 });

  useEffect(() => {
    loadComics();
  }, []);

  const loadComics = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getImageChecker();
      setComics(response.data || []);
    } catch (error) {
      console.error('Error al cargar comics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkImageStatus = async (comic) => {
    if (!comic.imagen_url) return 'no-url';

    try {
      // Use the backend proxy to avoid CORS issues
      const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/public/proxy-image?url=${encodeURIComponent(comic.imagen_url)}`;
      const response = await fetch(proxyUrl, { method: 'HEAD' });
      return response.ok ? 'loaded' : 'broken';
    } catch (error) {
      return 'broken';
    }
  };

  const checkAllImages = async () => {
    setCheckingImages(true);
    setCheckingProgress({ checked: 0, total: comics.length });
    const statuses = {};

    // Process images in batches of 5 to avoid overwhelming the network
    const batchSize = 5;
    for (let i = 0; i < comics.length; i += batchSize) {
      const batch = comics.slice(i, i + batchSize);
      const batchPromises = batch.map(async (comic) => {
        const status = await checkImageStatus(comic);
        return { id: comic.id, status };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, status }) => {
        statuses[id] = status;
      });

      setCheckingProgress({ checked: Math.min(i + batchSize, comics.length), total: comics.length });
      setImageStatuses({ ...statuses });
    }

    setCheckingImages(false);
    setCheckingProgress({ checked: 0, total: 0 });
  };

  const filteredComics = comics.filter((comic) => {
    const matchSearch =
      comic.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.numero_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.editorial_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    if (showBrokenOnly) {
      const status = imageStatuses[comic.id];
      return matchSearch && (status === 'broken' || status === 'no-url');
    }

    return matchSearch;
  });

  const getStatusIcon = (comic) => {
    const status = imageStatuses[comic.id];

    if (!status) return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;

    switch (status) {
      case 'loaded':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'broken':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'no-url':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusText = (comic) => {
    const status = imageStatuses[comic.id];

    if (!status) return 'Verificando...';

    switch (status) {
      case 'loaded':
        return 'Imagen cargada correctamente';
      case 'broken':
        return 'Imagen rota o inaccesible';
      case 'no-url':
        return 'Sin URL de imagen';
      default:
        return 'Verificando...';
    }
  };

  const brokenImagesCount = Object.values(imageStatuses).filter(status => status === 'broken' || status === 'no-url').length;
  const loadedImagesCount = Object.values(imageStatuses).filter(status => status === 'loaded').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando verificador de imágenes...</p>
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
              <Link to="/" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Comiquería</h1>
                  <p className="text-xs text-gray-500">Verificador de Imágenes</p>
                </div>
              </Link>
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
        {/* Header Section */}
        <div className="text-center mb-8 fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Verificador de Imágenes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verifica el estado de carga de todas las imágenes de comics en la base de datos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{comics.length}</div>
            <div className="text-gray-600">Total de Comics</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{loadedImagesCount}</div>
            <div className="text-gray-600">Imágenes Cargadas</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{brokenImagesCount}</div>
            <div className="text-gray-600">Imágenes Rotas</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar comics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Toggle Broken Only */}
              <button
                onClick={() => setShowBrokenOnly(!showBrokenOnly)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  showBrokenOnly
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                }`}
              >
                {showBrokenOnly ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {showBrokenOnly ? 'Mostrar Todas' : 'Solo Rotas'}
              </button>
            </div>

            {/* Check Images Button */}
            <div className="flex flex-col items-end gap-2">
              {checkingImages && (
                <div className="text-sm text-gray-600">
                  Verificando {checkingProgress.checked} de {checkingProgress.total} imágenes...
                </div>
              )}
              <button
                onClick={checkAllImages}
                disabled={checkingImages}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {checkingImages ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {checkingImages ? 'Verificando...' : 'Verificar Imágenes'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              Resultados ({filteredComics.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredComics.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {showBrokenOnly ? 'No hay imágenes rotas' : 'No se encontraron resultados'}
                </h3>
                <p className="text-gray-600">
                  {showBrokenOnly
                    ? '¡Excelente! Todas las imágenes están funcionando correctamente.'
                    : 'Intenta con otros términos de búsqueda.'}
                </p>
              </div>
            ) : (
              filteredComics.map((comic) => (
                <div key={comic.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(comic)}
                    </div>

                    {/* Comic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {comic.titulo}
                        </h4>
                        <span className="text-sm text-gray-500">
                          #{comic.numero_edicion}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Editorial: {comic.editorial_nombre}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        URL: {comic.imagen_url}
                      </p>
                    </div>

                    {/* Status Text */}
                    <div className="flex-shrink-0 text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                        imageStatuses[comic.id] === 'loaded'
                          ? 'bg-green-100 text-green-800'
                          : imageStatuses[comic.id] === 'broken'
                          ? 'bg-red-100 text-red-800'
                          : imageStatuses[comic.id] === 'no-url'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(comic)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Back to Catalog */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-600 text-white font-medium rounded-xl hover:bg-secondary-700 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Catálogo
          </Link>
        </div>
      </main>
    </div>
  );
}

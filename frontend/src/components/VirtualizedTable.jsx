import React, { useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { ArrowUpDown, ArrowUp, ArrowDown, ImageOff } from 'lucide-react';
import LazyImage from './LazyImage';

const VirtualizedTable = ({
  comics,
  hasNextPage,
  isNextPageLoading,
  loadMoreItems,
  sortConfig,
  handleSort,
  selectedComics,
  handleSelectComic,
  handleSelectAll,
  handleOpenModal,
  handleDelete,
  imagenesRotas,
  handleImageError,
  itemCount,
  itemSize = 80, // Height of each row
}) => {
  const [listRef, setListRef] = useState(null);

  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const itemCountWithLoading = hasNextPage ? itemCount + 1 : itemCount;

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  const loadMoreItemsCallback = isNextPageLoading ? () => {} : loadMoreItems;

  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = useCallback(
    (index) => !hasNextPage || index < comics.length,
    [hasNextPage, comics.length]
  );

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? (
        <ArrowUp className="w-4 h-4 text-primary-600" />
      ) : (
        <ArrowDown className="w-4 h-4 text-primary-600" />
      );
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  // Render a table row
  const Row = ({ index, style }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando más comics...</p>
          </div>
        </div>
      );
    }

    const comic = comics[index];
    if (!comic) return null;

    return (
      <div style={style} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <div className="flex items-center px-6 py-4">
          {/* Checkbox */}
          <div className="w-12 flex-shrink-0">
            <input
              type="checkbox"
              checked={selectedComics.has(comic.id)}
              onChange={() => handleSelectComic(comic.id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>

          {/* Comic Info */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {imagenesRotas.has(comic.id) || !comic.imagen_url ? (
              <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <ImageOff className="w-6 h-6 text-gray-400" />
              </div>
            ) : (
              <LazyImage
                src={comic.imagen_url}
                alt={comic.titulo}
                className="w-12 h-16 object-cover rounded flex-shrink-0"
                onError={() => handleImageError(comic.id)}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{comic.titulo}</p>
              <p className="text-sm text-gray-500">#{comic.numero_edicion}</p>
            </div>
          </div>

          {/* Edition Number */}
          <div className="w-24 flex-shrink-0 text-center">
            <span className="font-semibold text-primary-600">#{comic.numero_edicion}</span>
          </div>

          {/* Editorial */}
          <div className="w-32 flex-shrink-0 text-sm text-gray-600 truncate">
            {comic.editorial_nombre}
          </div>

          {/* Price */}
          <div className="w-20 flex-shrink-0 text-center">
            <span className="font-semibold text-green-600">${comic.precio}</span>
          </div>

          {/* Stock */}
          <div className="w-20 flex-shrink-0 text-center">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold text-xs ${
                (comic.stock || 0) === 0
                  ? 'text-red-600 bg-red-50'
                  : (comic.stock || 0) < 5
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-green-600 bg-green-50'
              }`}
            >
              {comic.stock || 0}
            </span>
          </div>

          {/* Genre */}
          <div className="w-24 flex-shrink-0 text-center">
            <span className="badge badge-primary text-xs">{comic.genero}</span>
          </div>

          {/* Estado */}
          <div className="w-24 flex-shrink-0 text-center">
            <span
              className={`badge text-xs ${
                comic.estado === 'En stock'
                  ? 'badge-success'
                  : comic.estado === 'Agotado'
                  ? 'badge-danger'
                  : comic.estado === 'Novedad'
                  ? 'badge-info'
                  : 'badge-warning'
              }`}
            >
              {comic.estado}
            </span>
          </div>

          {/* Actions */}
          <div className="w-20 flex-shrink-0 flex items-center justify-center gap-2">
            <button
              onClick={() => handleOpenModal(comic)}
              className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="Editar comic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(comic.id, comic.titulo)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar comic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card overflow-hidden p-0">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center">
          {/* Checkbox Header */}
          <div className="w-12 flex-shrink-0">
            <input
              type="checkbox"
              checked={selectedComics.size === comics.length && comics.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>

          {/* Comic Header */}
          <div className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('titulo')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Comic</span>
            {getSortIcon('titulo')}
          </div>

          {/* Edition Header */}
          <div className="w-24 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('numero_edicion')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">N° Edición</span>
            {getSortIcon('numero_edicion')}
          </div>

          {/* Editorial Header */}
          <div className="w-32 flex-shrink-0 flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('editorial')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Editorial</span>
            {getSortIcon('editorial')}
          </div>

          {/* Price Header */}
          <div className="w-20 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('precio')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</span>
            {getSortIcon('precio')}
          </div>

          {/* Stock Header */}
          <div className="w-20 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('stock')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</span>
            {getSortIcon('stock')}
          </div>

          {/* Genre Header */}
          <div className="w-24 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors px-2 py-1 rounded" onClick={() => handleSort('genero')}>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Género</span>
            {getSortIcon('genero')}
          </div>

          {/* Estado Header */}
          <div className="w-24 flex-shrink-0 text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
          </div>

          {/* Actions Header */}
          <div className="w-20 flex-shrink-0 text-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</span>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <div className="h-96"> {/* Fixed height container */}
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCountWithLoading}
          loadMoreItems={loadMoreItemsCallback}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(listRef) => {
                ref(listRef);
                setListRef(listRef);
              }}
              onItemsRendered={onItemsRendered}
              height={384} // 96 * 4 = 384px (h-96 in Tailwind)
              itemCount={itemCountWithLoading}
              itemSize={itemSize}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </div>
    </div>
  );
};

export default VirtualizedTable;

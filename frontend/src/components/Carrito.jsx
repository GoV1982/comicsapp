// src/components/Carrito.jsx
import { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useCarrito } from '../contexts/CarritoContext';
import { useAuthClientes } from '../contexts/AuthContextClientes';
import { Link } from 'react-router-dom';

export default function Carrito({ isOpen, onClose }) {
  const { carrito, total, loading, updateCantidad, removeFromCarrito, clearCarrito, getCantidadItems } = useCarrito();
  const { isAuthenticated } = useAuthClientes();
  const [clearing, setClearing] = useState(false);

  const handleUpdateCantidad = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    const result = await updateCantidad(itemId, nuevaCantidad);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este item del carrito?')) {
      const result = await removeFromCarrito(itemId);
      if (!result.success) {
        alert(result.message);
      }
    }
  };

  const handleClearCarrito = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
      setClearing(true);
      const result = await clearCarrito();
      if (!result.success) {
        alert(result.message);
      }
      setClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel del carrito */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Carrito de Compras
              </h2>
              {getCantidadItems() > 0 && (
                <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getCantidadItems()}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Contenido del carrito */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : carrito.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-500 mb-4">
                  Agrega algunos comics a tu carrito
                </p>
                <button
                  onClick={onClose}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Imagen del comic */}
                    <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Información del item */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.titulo}
                      </h4>
                      {item.numero_edicion && (
                        <p className="text-sm text-gray-600">
                          Edición #{item.numero_edicion}
                        </p>
                      )}
                      {item.editorial_nombre && (
                        <p className="text-sm text-gray-500">
                          {item.editorial_nombre}
                        </p>
                      )}
                      <p className="text-sm font-medium text-primary-600">
                        ${item.precio_unitario}
                      </p>
                    </div>

                    {/* Controles de cantidad y eliminar */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateCantidad(item.id, item.cantidad - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleUpdateCantidad(item.id, item.cantidad + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.cantidad * item.precio_unitario).toFixed(2)}
                      </p>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con total y acciones */}
          {carrito.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                {isAuthenticated ? (
                  <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Proceder al Pago
                  </button>
                ) : (
                  <Link
                    to="/login-cliente"
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión para Comprar
                  </Link>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleClearCarrito}
                    disabled={clearing}
                    className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearing ? 'Vaciando...' : 'Vaciar Carrito'}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Continuar Comprando
                  </button>
                </div>
              </div>

              {/* Mensaje para usuarios no autenticados */}
              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center">
                  Inicia sesión para guardar tu carrito y proceder con la compra
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

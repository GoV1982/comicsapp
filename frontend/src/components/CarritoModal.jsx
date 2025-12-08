import { useState } from 'react';
import { useCarrito } from '../contexts/CarritoContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Loader2,
  User,
  LogIn,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CarritoModal({ isOpen, onClose }) {
  const { carrito, total, loading, updateCantidad, removeFromCarrito, clearCarrito } = useCarrito();
  const { cliente } = useAuth();
  const { formatearPrecio, convertirPrecio, monedaSeleccionada, getTasaActual } = useCurrency();
  const isAuthenticated = !!cliente;
  const [updatingItem, setUpdatingItem] = useState(null);



  const handleUpdateCantidad = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    setUpdatingItem(itemId);
    try {
      await updateCantidad(itemId, nuevaCantidad);
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingItem(itemId);
    try {
      await removeFromCarrito(itemId);
    } catch (error) {
      console.error('Error al remover item:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCarrito = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      try {
        await clearCarrito();
      } catch (error) {
        console.error('Error al vaciar carrito:', error);
      }
    }
  };

  const handlePreOrdenar = async () => {
    // Obtener número de WhatsApp del admin desde la configuración
    let numeroWhatsApp = '5491234567890'; // Número por defecto

    try {
      const response = await fetch(`http://localhost:3002/api/configuracion/global`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.whatsapp_numero) {
          numeroWhatsApp = data.data.whatsapp_numero;
        }
      }
    } catch (error) {
      console.error('Error al obtener configuración:', error);
    }

    // Obtener datos completos del perfil del cliente
    let clienteCompleto = cliente;
    if (cliente) {
      try {
        const token = localStorage.getItem('cliente_token');
        const perfilResponse = await fetch(`http://localhost:3002/api/perfil`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (perfilResponse.ok) {
          const perfilData = await perfilResponse.json();
          if (perfilData.success) {
            clienteCompleto = perfilData.data;
          }
        }
      } catch (error) {
        console.error('Error al obtener perfil completo:', error);
      }
    }

    // Guardar la pre-orden en la base de datos
    let orderId = null;
    try {
      const token = localStorage.getItem('cliente_token');
      const orderPayload = {
        cliente_id: cliente.id,
        metodo_pago: 'whatsapp',
        notas: 'Pre-orden iniciada vía WhatsApp',
        estado: 'pendiente',
        items: carrito.map(item => ({
          comic_id: item.comic_id || item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario || item.precio
        }))
      };

      const orderResponse = await fetch(`http://localhost:3002/api/ventas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        if (orderData.success) {
          orderId = orderData.data.id;
          // Opcional: Limpiar carrito después de pre-ordenar exitosa
          // await clearCarrito(); 
        }
      }
    } catch (error) {
      console.error('Error al guardar pre-orden:', error);
    }

    // Preparar detalles del pedido con moneda seleccionada
    const tasa = getTasaActual();
    const simbolo = tasa?.simbolo || '$';
    const moneda = monedaSeleccionada;

    const itemsText = carrito.map(item => {
      const precioUnitarioARS = item.precio || item.precio_unitario;
      const subtotalARS = precioUnitarioARS * item.cantidad;

      const precioUnitarioDisplay = moneda === 'ARS'
        ? `$${precioUnitarioARS.toFixed(0)}`
        : `${simbolo} ${convertirPrecio(precioUnitarioARS).toFixed(2)}`;

      const subtotalDisplay = moneda === 'ARS'
        ? `$${subtotalARS.toFixed(2)}`
        : `${simbolo} ${convertirPrecio(subtotalARS).toFixed(2)}`;

      return `• ${item.titulo} (${item.editorial_nombre})\n  Cantidad: ${item.cantidad} - Precio unit: ${precioUnitarioDisplay} - Subtotal: ${subtotalDisplay}`;
    }).join('\n\n');

    const clienteInfo = clienteCompleto ? `\n\n📋 *Datos del Cliente:*\nNombre: ${clienteCompleto.nombre}${clienteCompleto.whatsapp ? `\nWhatsApp: ${clienteCompleto.whatsapp}` : ''}${clienteCompleto.telefono ? `\nTeléfono: ${clienteCompleto.telefono}` : ''}${clienteCompleto.direccion ? `\nDirección: ${clienteCompleto.direccion}` : ''}` : '';

    const orderReference = orderId ? `\n\n🆔 *Orden #${orderId}*` : '';

    const totalDisplay = moneda === 'ARS'
      ? `$${total.toFixed(2)}`
      : `${simbolo} ${convertirPrecio(total).toFixed(2)} (${moneda})`;

    const mensaje = `🛒 *NUEVA PRE-ORDEN*${orderReference}\n\n📚 *Detalle del Pedido:*\n\n${itemsText}\n\n💰 *TOTAL: ${totalDisplay}*${clienteInfo}\n\n⏰ Por favor, confirmen disponibilidad y coordinemos el pago y entrega.`;

    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    // Abrir WhatsApp en nueva ventana
    window.open(whatsappUrl, '_blank');

    // Cerrar el modal del carrito
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Carrito de Compras
              </h2>
              {carrito.length > 0 && (
                <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                  {carrito.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && carrito.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : carrito.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-500 mb-4">
                  Agrega algunos cómics para comenzar
                </p>
                <button
                  onClick={onClose}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Imagen */}
                    <div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📚
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {item.titulo}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">
                        #{item.numero_edicion} • {item.editorial_nombre}
                      </p>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateCantidad(item.id, item.cantidad - 1)}
                          disabled={updatingItem === item.id || item.cantidad <= 1}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="text-sm font-medium w-8 text-center">
                          {updatingItem === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                          ) : (
                            item.cantidad
                          )}
                        </span>

                        <button
                          onClick={() => handleUpdateCantidad(item.id, item.cantidad + 1)}
                          disabled={updatingItem === item.id}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingItem === item.id}
                          className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Precio */}
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatearPrecio(item.precio * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {carrito.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatearPrecio(total)}
                </span>
              </div>

              <div className="space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={handlePreOrdenar}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Pre-ordenar por WhatsApp
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login-cliente"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Iniciar Sesión para Comprar
                    </Link>
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Registrarse
                    </Link>
                  </div>
                )}

                <button
                  onClick={handleClearCarrito}
                  className="w-full px-4 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

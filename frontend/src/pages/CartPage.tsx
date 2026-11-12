import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../services/api';
import { useCart } from '../hooks/useCart';

export const CartPage: React.FC = () => {
  const { items, total, isEmpty, removeFromCart, updateQuantity, clearCart } = useCart();
  const placeholder = '/placeholder.svg';

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Carrito de Compras</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4 sm:mb-6">Tu carrito está vacío</p>
            <Link
              to="/catalogo"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600"
            >
              Ir al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 pb-32">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Carrito de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6 border-b border-gray-200 last:border-b-0"
                >
                  {/* Imagen */}
                  <img
                    src={item.image || placeholder}
                    alt={item.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                  />

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/producto/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm sm:text-lg font-semibold text-gray-900 hover:text-red-500 line-clamp-2 block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm sm:text-base text-gray-600">{formatCurrency(item.price)}</p>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-1.5 sm:px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-10 sm:w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-1.5 sm:px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[70px] sm:min-w-[100px] flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 text-red-500 hover:text-red-700 font-semibold text-lg flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-3">
              <Link
                to="/catalogo"
                className="text-center text-red-500 hover:text-red-600 font-semibold py-2"
              >
                ← Continuar Comprando
              </Link>
              <button
                onClick={clearCart}
                className="text-center text-gray-500 hover:text-gray-700 font-semibold py-2"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>

          {/* Resumen de compra - Sticky */}
          <div className="fixed bottom-0 left-0 right-0 sm:static lg:sticky lg:top-6 bg-white sm:bg-transparent sm:rounded-lg sm:shadow-md p-3 sm:p-6 sm:h-fit border-t sm:border-t-0 border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Resumen</h2>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>{items.length} producto(s)</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="border-t border-gray-200"></div>
              <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-red-500 text-white py-3 rounded-lg font-bold text-center hover:bg-red-600 transition-colors mb-2"
            >
              Ir a Checkout
            </Link>

            <button
              onClick={() => window.location.href = `https://wa.me/543764710683?text=${encodeURIComponent(`Quiero hacer un pedido con ${items.length} productos. Total: ${formatCurrency(total)}`)}`}
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-bold text-center hover:bg-green-600 transition-colors"
            >
              📱 Ordenar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../services/api';
import { useCart } from '../hooks/useCart';

export const CartPage: React.FC = () => {
  const { items, total, isEmpty, removeFromCart, updateQuantity, clearCart } = useCart();
  const placeholder = '/placeholder.svg';

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrito de Compras</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg mb-6">Tu carrito está vacío</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrito de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-6 border-b border-gray-200 last:border-b-0"
                >
                  {/* Imagen */}
                  <img
                    src={item.image || placeholder}
                    alt={item.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
                    className="w-20 h-20 object-cover rounded"
                  />

                  {/* Información */}
                  <div className="flex-1">
                    <Link
                      to={`/producto/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-lg font-semibold text-gray-900 hover:text-red-500"
                    >
                      {item.name}
                    </Link>
                    <p className="text-gray-600">{formatCurrency(item.price)}</p>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[100px]">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                  </div>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-4 text-red-500 hover:text-red-700 font-semibold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex justify-between">
              <Link
                to="/catalogo"
                className="text-red-500 hover:text-red-600 font-semibold"
              >
                ← Continuar Comprando
              </Link>
              <button
                onClick={clearCart}
                className="text-gray-500 hover:text-gray-700 font-semibold"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>

          {/* Resumen de compra */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>{items.length} producto(s)</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="border-t border-gray-200"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-red-500 text-white py-3 rounded-lg font-bold text-center hover:bg-red-600 transition-colors"
            >
              Ir a Checkout
            </Link>

            <button
              onClick={() => window.location.href = `https://wa.me/543764710683?text=${encodeURIComponent(`Quiero hacer un pedido con ${items.length} productos. Total: ${formatCurrency(total)}`)}`}
              className="block w-full mt-3 bg-green-500 text-white py-3 rounded-lg font-bold text-center hover:bg-green-600 transition-colors"
            >
              📱 Ordenar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

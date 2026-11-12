import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { apiService } from '../services/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart, isEmpty } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'cash',
    notes: '',
  });

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Carrito Vacío</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Por favor agrega productos antes de hacer checkout</p>
          <button
            onClick={() => navigate('/catalogo')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600"
          >
            Ir al Catálogo
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createOrder({
        ...formData,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      });

      setSuccess(true);
      const orderNumber = response.order_number;
      clearCart();
      setTimeout(() => {
        navigate(`/order-confirmation/${orderNumber}`);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al procesar el pedido. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center mx-3">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✓</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">¡Pedido Creado!</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Redirigiendo a confirmación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 pb-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm min-h-11"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm min-h-11"
                      placeholder="+54 376 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Dirección de Entrega *
                  </label>
                  <textarea
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm"
                    placeholder="Calle, número, barrio, referencias..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Método de Pago *
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm min-h-11"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="whatsapp">WhatsApp Pay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm"
                    placeholder="Instrucciones especiales..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-colors text-base min-h-11 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </form>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 sm:static lg:sticky lg:top-6 bg-white sm:bg-transparent sm:rounded-lg sm:shadow-md p-3 sm:p-6 sm:h-fit border-t sm:border-t-0 border-gray-200">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-3 sm:mb-6">Resumen</h2>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs sm:text-sm text-gray-700">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 sm:pt-4">
              <div className="flex justify-between mb-2 text-xs sm:text-sm text-gray-700">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-xs sm:text-sm text-gray-700">
                <span>Envío</span>
                <span>A confirmar</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 border-t border-gray-200 pt-3 sm:pt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

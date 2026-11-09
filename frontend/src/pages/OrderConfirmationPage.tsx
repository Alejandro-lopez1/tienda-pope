import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '../services/api';
import { apiFetch } from '../services/apiFetch';

interface OrderItem {
  id: number;
  product: { id: number; name: string; price: number };
  quantity: number;
  price: number;
  discount_percentage: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  paid: boolean;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const response = await apiFetch(`/orders/${orderId}/`, { auth: false });
        if (!response.ok) throw new Error('No se pudo cargar el pedido');
        const data: Order = await response.json();
        setOrder(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar pedido:', err);
        setError('No se encontró el pedido. Verifica el número de orden.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleDownloadPdf = async () => {
    if (!orderId) return;
    try {
      setDownloadingPdf(true);
      const response = await apiFetch(`/orders/${orderId}/generate-pdf/`, { auth: false });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = order ? `Recibo_${order.order_number}.pdf` : 'recibo.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('No se pudo descargar el recibo. Intenta nuevamente.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!orderId) return;
    try {
      setSendingWhatsapp(true);
      const response = await apiFetch(`/orders/${orderId}/send-whatsapp/`, { method: 'POST', auth: false });
      if (!response.ok) throw new Error('Error al generar enlace de WhatsApp');
      const data = await response.json();
      window.open(data.whatsapp_link, '_blank');
    } catch (err) {
      console.error('Error al enviar WhatsApp:', err);
      alert('No se pudo enviar por WhatsApp. Intenta nuevamente.');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleContinueShopping = () => navigate('/');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#FF4757] rounded-full"></div>
          <p className="mt-4 text-gray-600">Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={handleContinueShopping} className="w-full bg-[#FF4757] hover:bg-[#ee3a3f] text-white font-semibold py-2 px-4 rounded transition">
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };
  const paymentLabels: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', whatsapp: 'WhatsApp Pay' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center border-t-4 border-[#7DC41F]">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-4">Gracias por tu compra en Popé</p>
          <div className="bg-gradient-to-r from-[#FF4757] to-[#FF6B7A] rounded-lg py-4 px-6 mb-6">
            <p className="text-white text-sm font-semibold mb-1">Tu número de pedido es:</p>
            <p className="text-white text-3xl font-bold font-mono">{order.order_number}</p>
          </div>
          <p className="text-sm text-gray-500">Guardá este número para consultar tu pedido</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del Pedido</h2>
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">Nombre:</span> {order.customer_name}</p>
              <p><span className="font-semibold">Teléfono:</span> {order.customer_phone}</p>
              {order.customer_address && <p><span className="font-semibold">Dirección:</span> {order.customer_address}</p>}
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.quantity * item.price)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)} c/u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-gray-700"><span>Subtotal:</span><span className="font-semibold">{formatCurrency(order.subtotal)}</span></div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600"><span>Descuento:</span><span className="font-semibold">-{formatCurrency(order.discount_amount)}</span></div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 bg-gradient-to-r from-[#FF4757]/10 to-[#7DC41F]/10 py-2 px-3 rounded">
              <span>Total:</span><span className="text-[#FF4757]">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-600">Método de pago</p><p className="font-semibold text-gray-900">{paymentLabels[order.payment_method] || order.payment_method}</p></div>
            <div><p className="text-sm text-gray-600">Estado</p><p className={`font-semibold ${order.status === 'confirmed' ? 'text-green-600' : order.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'}`}>{statusLabels[order.status] || order.status}</p></div>
            <div><p className="text-sm text-gray-600">¿Pagado?</p><p className={`font-semibold ${order.paid ? 'text-green-600' : 'text-gray-600'}`}>{order.paid ? 'Sí ✓' : 'No'}</p></div>
            <div><p className="text-sm text-gray-600">Fecha</p><p className="font-semibold text-gray-900">{new Date(order.created_at).toLocaleDateString('es-AR')}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">¿Qué deseas hacer?</h2>
          <div className="space-y-3">
            <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="w-full bg-[#7DC41F] hover:bg-[#6ab316] disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center gap-2">
              {downloadingPdf ? 'Descargando...' : '📄 Descargar Recibo (PDF)'}
            </button>
            <button onClick={handleSendWhatsapp} disabled={sendingWhatsapp} className="w-full bg-[#25D366] hover:bg-[#1fb85c] disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center gap-2">
              {sendingWhatsapp ? 'Preparando...' : '💬 Enviar por WhatsApp'}
            </button>
            <button onClick={handleContinueShopping} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded transition">Seguir Comprando</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../services/api';
import { apiFetch } from '../../services/apiFetch';

interface OrderItemDetail {
  id: number;
  product_name?: string;
  product?: { name?: string } | number;
  quantity: number;
  price: number | string;
  total?: number | string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  total: number | string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paid: boolean;
  payment_method?: string;
  created_at: string;
  items?: OrderItemDetail[];
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paidFilter, setPaidFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('-created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery, paidFilter, sortBy, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (paidFilter) params.append('paid', paidFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('ordering', sortBy);
      params.append('page', currentPage.toString());
      const response = await apiFetch(`/orders/?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar pedidos');
      const data: PaginatedResponse = await response.json();
      setOrders(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const readError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      if (data && typeof data.error === 'string') return data.error;
    } catch {
      /* ignore */
    }
    return fallback;
  };

  const applyOrderUpdate = (updated: Order) => {
    setSelectedOrder(updated);
    fetchOrders();
  };

  const handleOpenOrder = async (order: Order) => {
    setShowModal(true);
    setModalError(null);
    setDetailLoading(true);
    setSelectedOrder(order);
    try {
      const response = await apiFetch(`/orders/${order.id}/`);
      if (!response.ok) throw new Error(await readError(response, 'No se pudo cargar el detalle del pedido'));
      const detail: Order = await response.json();
      setSelectedOrder(detail);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al cargar detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setModalError(null);
  };

  const handleMarkPaid = async (orderId: number) => {
    try {
      setActionLoading(true);
      setModalError(null);
      const response = await apiFetch(`/orders/${orderId}/mark_paid/`, { method: 'PATCH' });
      if (!response.ok) throw new Error(await readError(response, 'Error al marcar como pagado'));
      const updated: Order = await response.json();
      applyOrderUpdate(updated);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;
    if (newStatus === selectedOrder.status) return;
    if (newStatus === 'cancelled') {
      const ok = window.confirm(
        '¿Cancelar este pedido? Se va a reponer el stock de los productos y no se va a poder reabrir.'
      );
      if (!ok) return;
    }
    try {
      setActionLoading(true);
      setModalError(null);
      const response = await apiFetch(`/orders/${selectedOrder.id}/update_status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Error al cambiar el estado'));
      const updated: Order = await response.json();
      applyOrderUpdate(updated);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async (orderId: number) => {
    try {
      setModalError(null);
      const response = await apiFetch(`/orders/${orderId}/generate-pdf/`);
      if (!response.ok) throw new Error(await readError(response, 'Error al generar PDF'));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_${selectedOrder?.order_number || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al descargar PDF');
    }
  };

  const whatsappPhone = String(selectedOrder?.customer_phone ?? '').replace(/\D/g, '');

  return (
    <AdminLayout title="Gestión de Pedidos">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar (Nro, Cliente, Teléfono)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ORD-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757]"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado de Pago</label>
            <select
              value={paidFilter}
              onChange={(e) => {
                setPaidFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757]"
            >
              <option value="">Todos</option>
              <option value="true">Pagado</option>
              <option value="false">No Pagado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757]"
            >
              <option value="-created_at">Más recientes</option>
              <option value="created_at">Más antiguos</option>
              <option value="-total">Mayor monto</option>
              <option value="total">Menor monto</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">❌ {error}</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-gray-600">📦 No hay pedidos que coincidan con los filtros</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nro. Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-[#FF4757]">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.paid ? <span className="text-green-600 font-semibold">✓ Pagado</span> : <span className="text-red-600 font-semibold">✗ No Pagado</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenOrder(order)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, orders.length)} de {orders.length} pedidos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 font-semibold rounded transition"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Detalle del Pedido - {selectedOrder.order_number}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {modalError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{modalError}</div>}
              {detailLoading ? (
                <div className="text-gray-600">Cargando detalle...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-lg text-gray-900">{formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm text-gray-600 mb-2">Estado del pedido</label>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                        disabled={selectedOrder.status === 'cancelled' || actionLoading}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF4757] disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[selectedOrder.status]}`}>
                        {statusLabels[selectedOrder.status]}
                      </span>
                    </div>
                    {selectedOrder.status === 'cancelled' && (
                      <p className="text-xs text-gray-500 mt-2">El pedido está cancelado; no se puede reabrir.</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Pago</p>
                    <div className="flex items-center gap-4">
                      {selectedOrder.paid ? (
                        <span className="text-green-600 font-semibold">✓ Pagado</span>
                      ) : (
                        <>
                          <span className="text-red-600 font-semibold">✗ No Pagado</span>
                          <button
                            onClick={() => handleMarkPaid(selectedOrder.id)}
                            disabled={actionLoading}
                            className="px-4 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-semibold rounded transition"
                          >
                            Marcar como Pagado
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-600 mb-2">Ítems</p>
                      <ul className="text-sm text-gray-800 space-y-1">
                        {selectedOrder.items.map((item) => (
                          <li key={item.id}>
                            {(item.product_name || (typeof item.product === 'object' ? item.product?.name : null) || 'Producto')} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-3">Acciones</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPDF(selectedOrder.id)}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition"
                      >
                        📄 Descargar PDF
                      </button>
                      <button
                        onClick={() => window.open(`https://wa.me/${whatsappPhone}`, '_blank')}
                        disabled={!whatsappPhone}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded transition"
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

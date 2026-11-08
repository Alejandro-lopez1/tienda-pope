import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../services/api';

interface Customer {
  customer_phone: string;
  customer_name: string;
  customer_address?: string | null;
  total_orders: number;
  total_spent: string | number;
  avg_order_value: string | number;
  paid_orders: number;
  pending_orders: number;
  last_order_date: string | null;
  first_order_date?: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('-total_spent');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, sortBy, currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('ordering', sortBy);
      params.append('page', currentPage.toString());
      const response = await fetch(`${API}/customers/?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data: PaginatedResponse = await response.json();
      setCustomers(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (phone: string) => {
    try {
      setLoadingOrders(true);
      const response = await fetch(
        `${API}/customers/orders/?phone=${encodeURIComponent(phone)}`,
        { headers: authHeaders() }
      );
      if (!response.ok) throw new Error('Error al cargar órdenes del cliente');
      const data = await response.json();
      setCustomerOrders(Array.isArray(data) ? data : []);
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
    await fetchCustomerOrders(customer.customer_phone);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const handleContactWhatsApp = (phone: string) => {
    const message = 'Hola, te contactamos desde Popé sobre tu compra.';
    const encodedMessage = encodeURIComponent(message);
    const digits = String(phone).replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${encodedMessage}`, '_blank');
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      setExporting(format);
      const params = new URLSearchParams({ format });
      if (searchQuery) params.append('search', searchQuery);
      const response = await fetch(`${API}/customers/export/?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('No se pudo exportar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_detalle.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(null);
    }
  };

  if (error) {
    return (
      <AdminLayout title="Gestión de Clientes">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestión de Clientes">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-white">Clientes</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {exporting === 'xlsx' ? 'Exportando…' : 'Exportar XLSX'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {exporting === 'csv' ? 'Exportando…' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar por nombre, teléfono o dirección
            </label>
            <input
              type="text"
              placeholder="Ej: Juan, 3764123456"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="-total_spent">Gasto total (Mayor a Menor)</option>
              <option value="total_spent">Gasto total (Menor a Mayor)</option>
              <option value="-total_orders">Más órdenes</option>
              <option value="total_orders">Menos órdenes</option>
              <option value="customer_name">Nombre (A-Z)</option>
              <option value="-last_order_date">Última compra</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Cargando clientes...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No hay clientes registrados</div>
          ) : (
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
                  <th className="px-6 py-3 text-center font-semibold">Órdenes</th>
                  <th className="px-6 py-3 text-right font-semibold">Gasto Total</th>
                  <th className="px-6 py-3 text-right font-semibold">Promedio</th>
                  <th className="px-6 py-3 text-center font-semibold">Pagadas</th>
                  <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.customer_phone}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{customer.customer_name || '(Sin nombre)'}</p>
                        {customer.customer_address ? (
                          <p className="text-xs text-slate-400 truncate max-w-[220px]">
                            {customer.customer_address}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{customer.customer_phone}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-700 px-3 py-1 rounded-full text-white font-medium">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-400">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {formatCurrency(customer.avg_order_value)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-400 font-medium">{customer.paid_orders}</span>
                      {customer.pending_orders > 0 && (
                        <span className="text-yellow-400 text-xs ml-2">
                          ({customer.pending_orders} pendientes)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenCustomer(customer)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleContactWhatsApp(customer.customer_phone)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && customers.length > 0 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50 hover:bg-slate-600 transition-colors"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-slate-400">Página {currentPage}</span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-700 border-b border-slate-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedCustomer.customer_name || 'Cliente'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-2xl">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Teléfono</p>
                  <p className="text-white font-medium">{selectedCustomer.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Última compra</p>
                  <p className="text-white font-medium">
                    {selectedCustomer.last_order_date
                      ? new Date(selectedCustomer.last_order_date).toLocaleDateString('es-AR')
                      : '-'}
                  </p>
                </div>
                {selectedCustomer.customer_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-400">Dirección</p>
                    <p className="text-white font-medium">{selectedCustomer.customer_address}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-700 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Total Órdenes</p>
                  <p className="text-2xl font-bold text-white">{selectedCustomer.total_orders}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Gasto Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(selectedCustomer.total_spent)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Promedio por Orden</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(selectedCustomer.avg_order_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Órdenes Pagadas</p>
                  <p className="text-2xl font-bold text-green-400">
                    {selectedCustomer.paid_orders}/{selectedCustomer.total_orders}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Órdenes</h4>
                {loadingOrders ? (
                  <div className="text-center text-slate-400">Cargando órdenes...</div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center text-slate-400">No hay órdenes registradas</div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-white">{order.order_number}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(order.created_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-400">{formatCurrency(order.total)}</p>
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-medium mt-1 ${getStatusBadgeColor(order.status)}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleContactWhatsApp(selectedCustomer.customer_phone)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Contactar por WhatsApp
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

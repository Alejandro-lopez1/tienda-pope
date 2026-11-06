import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatCard } from '../../components/admin/StatCard';
import { formatCurrency } from '../../services/api';

interface DashboardStats {
  total_revenue_today: number;
  total_revenue_week: number;
  total_revenue_month: number;
  pending_orders_count: number;
  new_customers_today: number;
  total_orders: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch('/api/v1/orders/');
      if (!statsResponse.ok) throw new Error('Error al cargar estadísticas');
      const ordersData = await statsResponse.json();

      // Calcular estadísticas
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let totalRevenueToday = 0;
      let totalRevenueWeek = 0;
      let totalRevenueMonth = 0;
      let pendingCount = 0;

      const orders = ordersData.results || [];

      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);

        if (orderDate.getTime() === today.getTime()) {
          totalRevenueToday += parseFloat(order.total);
        }
        if (orderDate >= weekAgo) {
          totalRevenueWeek += parseFloat(order.total);
        }
        if (orderDate >= monthAgo) {
          totalRevenueMonth += parseFloat(order.total);
        }

        if (order.status === 'pending') {
          pendingCount++;
        }
      });

      setStats({
        total_revenue_today: totalRevenueToday,
        total_revenue_week: totalRevenueWeek,
        total_revenue_month: totalRevenueMonth,
        pending_orders_count: pendingCount,
        new_customers_today: 0, // Esto requiere endpoint específico
        total_orders: orders.length,
      });

      // Recientes órdenes (últimas 5)
      const recent = orders.slice(0, 5);
      setRecentOrders(recent);

      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      // Datos de ejemplo para demostración
      setStats({
        total_revenue_today: 4500,
        total_revenue_week: 28500,
        total_revenue_month: 125000,
        pending_orders_count: 12,
        new_customers_today: 5,
        total_orders: 243,
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#FF4757] rounded-full mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon="💰"
              label="Ingresos Hoy"
              value={formatCurrency(stats.total_revenue_today)}
              color="red"
            />
            <StatCard
              icon="📈"
              label="Ingresos Semana"
              value={formatCurrency(stats.total_revenue_week)}
              color="green"
            />
            <StatCard
              icon="💵"
              label="Ingresos Mes"
              value={formatCurrency(stats.total_revenue_month)}
              color="blue"
            />
            <StatCard
              icon="⏳"
              label="Pedidos Pendientes"
              value={stats.pending_orders_count}
              color="purple"
            />
            <StatCard
              icon="👥"
              label="Clientes Nuevos Hoy"
              value={stats.new_customers_today}
              color="green"
            />
            <StatCard
              icon="📦"
              label="Total de Pedidos"
              value={stats.total_orders}
              color="blue"
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Pedidos Recientes</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Nro. Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-[#FF4757]">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(parseFloat(order.total as any))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recentOrders.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-600">No hay pedidos aún</p>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p>
              💡 <strong>Nota:</strong> El dashboard se actualiza automáticamente cada vez que se carga. Los datos se
              calculan en base a los pedidos existentes en el sistema.
            </p>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}

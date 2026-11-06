import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../services/api';

interface ReportData {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  avg_order_value: number;
  revenue_this_month: number;
  orders_this_month: number;
  customers_this_month: number;
  repeat_customers: number;
  top_products: Array<{ name: string; sales: number; revenue: number }>;
  top_customers: Array<{ name: string; orders: number; total_spent: number }>;
  order_status_breakdown: Array<{ status: string; count: number }>;
  payment_status_breakdown: Array<{ status: string; count: number }>;
  revenue_by_category: Array<{ category: string; revenue: number }>;
  daily_revenue: Array<{ date: string; revenue: number }>;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'customers' | 'products'>('overview');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // En una app real, obtendríamos de /api/v1/reports/summary/
      // Para MVP, generamos datos de demo
      const mockReports: ReportData = {
        total_revenue: 125000,
        total_orders: 342,
        total_customers: 87,
        avg_order_value: 365.5,
        revenue_this_month: 45000,
        orders_this_month: 98,
        customers_this_month: 23,
        repeat_customers: 34,
        top_products: [
          { name: 'Desinfectante Multiusos 500ml', sales: 156, revenue: 18720 },
          { name: 'Jabón Líquido 1L', sales: 142, revenue: 16380 },
          { name: 'Detergente Ropa 2kg', sales: 118, revenue: 14160 },
          { name: 'Lavandina 2L', sales: 95, revenue: 11400 },
          { name: 'Papel Higiénico x4', sales: 87, revenue: 8700 },
        ],
        top_customers: [
          { name: 'Supermercado Central', orders: 12, total_spent: 18500 },
          { name: 'Farmacia San Martín', orders: 8, total_spent: 12400 },
          { name: 'Kiosko La Esquina', orders: 7, total_spent: 8900 },
          { name: 'Limpieza Rápida SRL', orders: 6, total_spent: 7850 },
          { name: 'Hogar Moderno', orders: 5, total_spent: 6200 },
        ],
        order_status_breakdown: [
          { status: 'Entregado', count: 285 },
          { status: 'Enviado', count: 32 },
          { status: 'Confirmado', count: 18 },
          { status: 'Pendiente', count: 5 },
          { status: 'Cancelado', count: 2 },
        ],
        payment_status_breakdown: [
          { status: 'Pagado', count: 312 },
          { status: 'No Pagado', count: 30 },
        ],
        revenue_by_category: [
          { category: 'Desinfectantes', revenue: 42000 },
          { category: 'Detergentes', revenue: 38500 },
          { category: 'Papel y Cartón', revenue: 22000 },
          { category: 'Otros', revenue: 22500 },
        ],
        daily_revenue: [
          { date: '2026-10-31', revenue: 1200 },
          { date: '2026-11-01', revenue: 1800 },
          { date: '2026-11-02', revenue: 1450 },
          { date: '2026-11-03', revenue: 2100 },
          { date: '2026-11-04', revenue: 1700 },
          { date: '2026-11-05', revenue: 2350 },
          { date: '2026-11-06', revenue: 1800 },
        ],
      };

      setReports(mockReports);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Ingresos Totales</p>
          <p className="text-3xl font-bold text-green-400">
            {formatCurrency(reports?.total_revenue || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            +{formatCurrency(reports?.revenue_this_month || 0)} este mes
          </p>
        </div>

        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Órdenes Totales</p>
          <p className="text-3xl font-bold text-blue-400">{reports?.total_orders || 0}</p>
          <p className="text-xs text-slate-500 mt-2">
            +{reports?.orders_this_month || 0} este mes
          </p>
        </div>

        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Clientes Totales</p>
          <p className="text-3xl font-bold text-purple-400">
            {reports?.total_customers || 0}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            +{reports?.customers_this_month || 0} este mes
          </p>
        </div>

        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm mb-2">Ticket Promedio</p>
          <p className="text-3xl font-bold text-orange-400">
            {formatCurrency(reports?.avg_order_value || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {reports?.repeat_customers || 0} clientes recurrentes
          </p>
        </div>
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Órdenes</h3>
          <div className="space-y-3">
            {reports?.order_status_breakdown.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="text-slate-300">{item.status}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(item.count / (reports?.total_orders || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-400 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Pagos</h3>
          <div className="space-y-3">
            {reports?.payment_status_breakdown.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="text-slate-300">{item.status}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'Pagado' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(item.count / (reports?.total_orders || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-400 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SalesTab = () => (
    <div className="space-y-6">
      {/* Revenue by Category */}
      <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Ingresos por Categoría</h3>
        <div className="space-y-4">
          {reports?.revenue_by_category.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">{item.category}</span>
                <span className="font-semibold text-green-400">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(item.revenue / (reports?.total_revenue || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Ingresos Diarios</h3>
        <div className="space-y-3">
          {reports?.daily_revenue.map((item) => (
            <div key={item.date} className="flex justify-between items-end gap-4">
              <span className="text-slate-400 text-sm w-32">
                {new Date(item.date).toLocaleDateString('es-AR')}
              </span>
              <div className="flex-1 bg-slate-600 rounded h-8 relative">
                <div
                  className="bg-blue-500 h-8 rounded transition-all"
                  style={{
                    width: `${(item.revenue / 2500) * 100}%`,
                  }}
                />
              </div>
              <span className="font-semibold text-green-400 w-28 text-right">
                {formatCurrency(item.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CustomersTab = () => (
    <div className="space-y-6">
      {/* Top Customers */}
      <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Top Clientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="px-4 py-3 text-left text-slate-300">Cliente</th>
                <th className="px-4 py-3 text-center text-slate-300">Órdenes</th>
                <th className="px-4 py-3 text-right text-slate-300">Gasto Total</th>
              </tr>
            </thead>
            <tbody>
              {reports?.top_customers.map((customer, idx) => (
                <tr key={idx} className="border-b border-slate-600 hover:bg-slate-600/50">
                  <td className="px-4 py-3 text-slate-200">{customer.name}</td>
                  <td className="px-4 py-3 text-center text-slate-300">
                    {customer.orders}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-semibold">
                    {formatCurrency(customer.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ProductsTab = () => (
    <div className="space-y-6">
      {/* Top Products */}
      <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Productos Más Vendidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="px-4 py-3 text-left text-slate-300">Producto</th>
                <th className="px-4 py-3 text-center text-slate-300">Unidades</th>
                <th className="px-4 py-3 text-right text-slate-300">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {reports?.top_products.map((product, idx) => (
                <tr key={idx} className="border-b border-slate-600 hover:bg-slate-600/50">
                  <td className="px-4 py-3 text-slate-200">{product.name}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{product.sales}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-semibold">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Reportes & Analytics</h2>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Resumen' },
            { id: 'sales', label: '💰 Ventas' },
            { id: 'customers', label: '👥 Clientes' },
            { id: 'products', label: '📦 Productos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Cargando reportes...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'sales' && <SalesTab />}
              {activeTab === 'customers' && <CustomersTab />}
              {activeTab === 'products' && <ProductsTab />}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

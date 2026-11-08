import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../services/api';
import { apiFetch } from '../../services/apiFetch';

interface Product {
  id: number; name: string; sku: string; price: string; discount_percentage: string; stock: number;
  is_active: boolean; is_featured: boolean; category: number | { id: number; name: string };
  rating: string; image: string; description: string; created_at: string;
}
interface Category { id: number; name: string }
interface PaginatedResponse { count: number; next: string | null; previous: string | null; results: Product[] }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('-created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => { fetchCategories(); fetchProducts(); }, [searchQuery, categoryFilter, statusFilter, sortBy, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await apiFetch('/categories/');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      setCategories(data.results || data);
    } catch (err) { console.error('Error:', err); }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter === 'active') params.append('is_active', 'true');
      else if (statusFilter === 'inactive') params.append('is_active', 'false');
      if (statusFilter === 'featured') params.append('is_featured', 'true');
      if (sortBy) params.append('ordering', sortBy);
      params.append('page', currentPage.toString());
      const response = await apiFetch(`/products/?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar productos');
      const data: PaginatedResponse = await response.json();
      setProducts(data.results || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const handleOpenForm = (product?: Product) => {
    if (product) { setSelectedProduct(product); setFormData(product); setIsEditing(true); }
    else { setSelectedProduct(null); setFormData({}); setIsEditing(false); }
    setShowModal(true);
  };
  const handleCloseModal = () => { setShowModal(false); setSelectedProduct(null); setFormData({}); setIsEditing(false); };

  const handleSaveProduct = async () => {
    try {
      if (!formData.name || !formData.sku || !formData.price || !formData.category) { alert('Por favor completa todos los campos requeridos'); return; }
      const url = isEditing ? `/products/${selectedProduct?.id}/` : '/products/';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await apiFetch(url, { method, body: JSON.stringify(formData) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(typeof errorData === 'object' ? Object.values(errorData as any).join(', ') : 'Error al guardar producto');
      }
      handleCloseModal(); fetchProducts(); alert(isEditing ? 'Producto actualizado' : 'Producto creado');
    } catch (err) { alert(err instanceof Error ? err.message : 'Error al guardar'); }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este producto?')) return;
    try {
      const response = await apiFetch(`/products/${productId}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar producto');
      fetchProducts(); alert('Producto eliminado');
    } catch (err) { alert(err instanceof Error ? err.message : 'Error al eliminar'); }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await apiFetch(`/products/${product.id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: !product.is_active }) });
      if (!response.ok) throw new Error('Error al cambiar estado');
      fetchProducts();
    } catch (err) { alert(err instanceof Error ? err.message : 'Error'); }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const response = await apiFetch(`/products/${product.id}/`, { method: 'PATCH', body: JSON.stringify({ is_featured: !product.is_featured }) });
      if (!response.ok) throw new Error('Error al cambiar destacado');
      fetchProducts();
    } catch (err) { alert(err instanceof Error ? err.message : 'Error'); }
  };

  const getCategoryName = (category: number | { id: number; name: string }) => {
    if (typeof category === 'number') return categories.find(c => c.id === category)?.name || 'N/A';
    return category?.name || 'N/A';
  };

  if (error) return (<AdminLayout title="Gestión de Productos"><div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div></AdminLayout>);

  return (
    <AdminLayout title="Gestión de Productos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Productos</h2>
          <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">+ Nuevo Producto</button>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label><input type="text" placeholder="Nombre, SKU..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Todas</option>{categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="featured">Destacados</option>
            </select></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Ordenar</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="-created_at">Más recientes</option><option value="created_at">Más antiguos</option><option value="-price">Precio (Mayor)</option><option value="price">Precio (Menor)</option><option value="-rating">Calificación</option><option value="name">Nombre (A-Z)</option>
            </select></div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          {loading ? (<div className="p-8 text-center text-slate-400">Cargando productos...</div>) : products.length === 0 ? (<div className="p-8 text-center text-slate-400">No hay productos</div>) : (
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 border-b border-slate-600"><tr>
                <th className="px-6 py-3 text-left font-semibold">Producto</th><th className="px-6 py-3 text-left font-semibold">SKU</th><th className="px-6 py-3 text-center font-semibold">Stock</th><th className="px-6 py-3 text-right font-semibold">Precio</th><th className="px-6 py-3 text-center font-semibold">Desc %</th><th className="px-6 py-3 text-center font-semibold">Cat</th><th className="px-6 py-3 text-center font-semibold">Estado</th><th className="px-6 py-3 text-center font-semibold">Dest</th><th className="px-6 py-3 text-center font-semibold">Acciones</th>
              </tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3">{product.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />}<div><p className="font-medium text-white">{product.name}</p><p className="text-xs text-slate-400 max-w-xs truncate">{product.description}</p></div></div></td>
                    <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-green-900 text-green-200' : product.stock > 0 ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'}`}>{product.stock}</span></td>
                    <td className="px-6 py-4 text-right font-semibold text-green-400">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-center">{parseFloat(product.discount_percentage) > 0 && <span className="bg-orange-900 text-orange-200 px-2 py-1 rounded text-xs">{product.discount_percentage}%</span>}</td>
                    <td className="px-6 py-4 text-center text-slate-400 text-xs">{getCategoryName(product.category)}</td>
                    <td className="px-6 py-4 text-center"><button onClick={() => handleToggleActive(product)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${product.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-slate-300'}`}>{product.is_active ? 'Activo' : 'Inactivo'}</button></td>
                    <td className="px-6 py-4 text-center"><button onClick={() => handleToggleFeatured(product)} className={`text-lg transition-colors ${product.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'}`}>★</button></td>
                    <td className="px-6 py-4"><div className="flex gap-2 justify-center"><button onClick={() => handleOpenForm(product)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">Editar</button><button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors">Eliminar</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-700 border-b border-slate-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label><input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">SKU *</label><input type="text" value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Precio (ARS) *</label><input type="number" step="0.01" min="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Descuento (%)</label><input type="number" step="0.01" min="0" max="100" value={formData.discount_percentage || '0'} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Stock</label><input type="number" min="0" value={formData.stock ?? '0'} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-2">Categoría *</label>
                  <select value={formData.category == null ? '' : typeof formData.category === 'object' ? formData.category.id : formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
                    <option value="">Seleccionar...</option>{categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label><textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.is_active || false} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" /><span className="text-sm text-slate-300">Activo</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.is_featured || false} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="w-4 h-4" /><span className="text-sm text-slate-300">Destacado</span></label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveProduct} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">{isEditing ? 'Actualizar' : 'Crear'}</button>
                <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

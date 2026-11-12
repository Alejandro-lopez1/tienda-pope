import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../services/api';
import { apiFetch } from '../../services/apiFetch';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  discount_percentage: string | number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category: number | { id: number; name: string };
  rating?: string | number;
  image?: string | null;
  description: string;
  created_at?: string;
}
interface Category { id: number; name: string }
interface PaginatedResponse { count: number; next: string | null; previous: string | null; results: Product[] }

interface ProductForm {
  name: string;
  sku: string;
  price: string;
  discount_percentage: string;
  stock: string;
  category: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
}

const emptyForm = (): ProductForm => ({
  name: '',
  sku: '',
  price: '',
  discount_percentage: '0',
  stock: '0',
  category: '',
  description: '',
  is_active: true,
  is_featured: false,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchQuery, categoryFilter, statusFilter, sortBy, currentPage]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const setPreview = (next: string | null) => {
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return next;
    });
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiFetch('/categories/');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];
      setCategories(list);
      return list as Category[];
    } catch (err) {
      console.error('Error:', err);
      return [] as Category[];
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      setCreatingCategory(true);
      const response = await apiFetch('/categories/', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(typeof err === 'object' ? Object.values(err as any).flat().join(', ') : 'No se pudo crear la categoría');
      }
      const created = await response.json();
      const list = await fetchCategories();
      const id = created?.id ?? list.find((c) => c.name === name)?.id;
      if (id) setForm((prev) => ({ ...prev, category: String(id) }));
      setNewCategoryName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product?: Product) => {
    setImageError(null);
    setImageFile(null);
    if (product) {
      setSelectedProduct(product);
      const cat = typeof product.category === 'object' ? product.category?.id : product.category;
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        price: String(product.price ?? ''),
        discount_percentage: String(product.discount_percentage ?? '0'),
        stock: String(product.stock ?? '0'),
        category: cat != null ? String(cat) : '',
        description: product.description || '',
        is_active: !!product.is_active,
        is_featured: !!product.is_featured,
      });
      setPreview(product.image || null);
      setIsEditing(true);
    } else {
      setSelectedProduct(null);
      setForm(emptyForm());
      setPreview(null);
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setForm(emptyForm());
    setImageFile(null);
    setImageError(null);
    setPreview(null);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageError(null);
    if (!file) {
      setImageFile(null);
      setPreview(selectedProduct?.image || null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('El archivo debe ser una imagen (JPG, PNG, WEBP, etc.).');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('La imagen supera el tamaño máximo permitido (5 MB).');
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSaveProduct = async () => {
    try {
      setImageError(null);
      if (!form.name || !form.sku || !form.price || !form.category) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('sku', form.sku);
      fd.append('price', form.price);
      fd.append('discount_percentage', form.discount_percentage || '0');
      fd.append('stock', form.stock || '0');
      fd.append('category', form.category);
      fd.append('description', form.description || '');
      fd.append('is_active', String(form.is_active));
      fd.append('is_featured', String(form.is_featured));
      if (imageFile) fd.append('image', imageFile);

      const url = isEditing ? `/products/${selectedProduct?.id}/` : '/products/';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await apiFetch(url, { method, body: fd });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = typeof errorData === 'object' && errorData
          ? Object.entries(errorData as Record<string, unknown>)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
              .join(' | ')
          : 'Error al guardar producto';
        throw new Error(msg || 'Error al guardar producto');
      }
      handleCloseModal();
      fetchProducts();
      alert(isEditing ? 'Producto actualizado' : 'Producto creado');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este producto?')) return;
    try {
      const response = await apiFetch(`/products/${productId}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar producto');
      fetchProducts();
      alert('Producto eliminado');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await apiFetch(`/products/${product.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      if (!response.ok) throw new Error('Error al cambiar estado');
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const response = await apiFetch(`/products/${product.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_featured: !product.is_featured }),
      });
      if (!response.ok) throw new Error('Error al cambiar destacado');
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const getCategoryName = (category: number | { id: number; name: string }) => {
    if (typeof category === 'number') return categories.find((c) => c.id === category)?.name || 'N/A';
    return category?.name || 'N/A';
  };

  if (error)
    return (
      <AdminLayout title="Gestión de Productos">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="Gestión de Productos">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            + Nuevo Producto
          </button>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label>
            <input type="text" placeholder="Nombre, SKU..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="featured">Destacados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ordenar</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
              <option value="-created_at">Más recientes</option>
              <option value="created_at">Más antiguos</option>
              <option value="-price">Precio (Mayor)</option>
              <option value="price">Precio (Menor)</option>
              <option value="-rating">Calificación</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No hay productos</div>
          ) : (
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Producto</th>
                  <th className="px-6 py-3 text-left font-semibold">SKU</th>
                  <th className="px-6 py-3 text-center font-semibold">Stock</th>
                  <th className="px-6 py-3 text-right font-semibold">Precio</th>
                  <th className="px-6 py-3 text-center font-semibold">Desc %</th>
                  <th className="px-6 py-3 text-center font-semibold">Cat</th>
                  <th className="px-6 py-3 text-center font-semibold">Estado</th>
                  <th className="px-6 py-3 text-center font-semibold">Dest</th>
                  <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />}
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-400 max-w-xs truncate">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-green-900 text-green-200' : product.stock > 0 ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'}`}>{product.stock}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-400">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-center">
                      {Number(product.discount_percentage) > 0 && <span className="bg-orange-900 text-orange-200 px-2 py-1 rounded text-xs">{Number(product.discount_percentage)}%</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 text-xs">{getCategoryName(product.category)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleActive(product)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${product.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-slate-300'}`}>{product.is_active ? 'Activo' : 'Inactivo'}</button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleFeatured(product)} className={`text-lg transition-colors ${product.is_featured ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'}`}>★</button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleOpenForm(product)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">Editar</button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors">Eliminar</button>
                      </div>
                    </td>
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SKU *</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Precio (ARS) *</label>
                  <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descuento (%)</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Categoría *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500">
                    <option value="">{categoriesLoading ? 'Cargando categorías...' : 'Seleccionar...'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700 rounded text-xs text-amber-200">
                      No hay categorías. Creá una para continuar:
                      <div className="mt-2 flex gap-2">
                        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nombre (ej: Limpieza)" className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:border-blue-500" />
                        <button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
                          {creatingCategory ? '...' : 'Crear'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Imagen</label>
                {imagePreview && (
                  <div className="mb-2">
                    <img src={imagePreview} alt="Vista previa" className="h-28 w-28 object-cover rounded border border-slate-600" />
                    <p className="text-xs text-slate-400 mt-1">
                      {imageFile ? 'Nueva imagen seleccionada' : 'Imagen actual (se mantiene si no elegís otra)'}
                    </p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-slate-600 file:text-white hover:file:bg-slate-500" />
                {imageError && <p className="text-sm text-red-400 mt-1">{imageError}</p>}
                <p className="text-xs text-slate-400 mt-1">Opcional. JPG/PNG/WEBP, máx. 5 MB. Si no elegís un archivo, la imagen actual no se modifica.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm text-slate-300">Activo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm text-slate-300">Destacado</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveProduct} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  {isEditing ? 'Actualizar' : 'Crear'}
                </button>
                <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

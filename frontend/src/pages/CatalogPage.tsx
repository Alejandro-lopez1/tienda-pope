import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters } from '../components/ProductFilters';
import { useProducts, useProductSearch } from '../hooks/useProducts';
import { apiService, Category } from '../services/api';

export const CatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category_id: undefined as number | undefined,
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    in_stock: undefined as boolean | undefined,
    sort: '-created_at' as string,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const regularProducts = useProducts(currentPage);
  const searchedProducts = useProductSearch({
    q: searchQuery,
    ...filters,
    page: currentPage,
  });

  const { products, total, loading, error, hasNext, hasPrevious } =
    searchQuery || Object.values(filters).some((v) => v !== undefined && v !== false && v !== '-created_at')
      ? searchedProducts
      : regularProducts;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await apiService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: {
    category_id?: number;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    sort?: string;
  }) => {
    setFilters({
      category_id: newFilters.category_id,
      min_price: newFilters.min_price,
      max_price: newFilters.max_price,
      in_stock: newFilters.in_stock,
      sort: newFilters.sort ?? '-created_at',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600">
            Descubre nuestros productos de limpieza de calidad premium
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {products.length} de {total} productos
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar de Filtros - solo visible en desktop */}
          <div className="md:col-span-1">
            <ProductFilters
              categories={categories}
              onFilterChange={handleFilterChange}
              onSearchChange={handleSearchChange}
            />
          </div>

          {/* Grid de Productos */}
          <div className="md:col-span-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                {/* Grid responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Paginación */}
                <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrevious}
                    className={`px-4 py-2 rounded font-semibold transition-colors ${
                      hasPrevious
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    ← Anterior
                  </button>

                  <span className="text-gray-600 font-semibold">
                    Página {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!hasNext}
                    className={`px-4 py-2 rounded font-semibold transition-colors ${
                      hasNext
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

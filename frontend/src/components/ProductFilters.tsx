import React, { useState } from 'react';
import { Category } from '../services/api';

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange: (filters: {
    category_id?: number;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    sort?: string;
  }) => void;
  onSearchChange: (query: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  onFilterChange,
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('-created_at');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchQuery);
  };

  const handleFilterChange = () => {
    onFilterChange({
      category_id: selectedCategory,
      min_price: priceRange.min || undefined,
      max_price: priceRange.max || undefined,
      in_stock: inStockOnly || undefined,
      sort: sort || undefined,
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [selectedCategory, priceRange, inStockOnly, sort]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Búsqueda */}
      <form onSubmit={handleSearchSubmit} className="mb-4 sm:mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 font-semibold flex-shrink-0"
            title="Buscar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Filtros */}
      <div className="space-y-4 sm:space-y-6">
        {/* Categorías */}
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Categorías</h3>
          <div className="space-y-2">
            <label className="flex items-center text-sm">
              <input
                type="radio"
                name="category"
                value=""
                checked={selectedCategory === undefined}
                onChange={() => setSelectedCategory(undefined)}
                className="w-4 h-4 text-red-500"
              />
              <span className="ml-2 text-gray-700">Todas</span>
            </label>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <label key={cat.id} className="flex items-center text-sm">
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={selectedCategory === cat.id}
                  onChange={() => setSelectedCategory(cat.id)}
                  className="w-4 h-4 text-red-500"
                />
                <span className="ml-2 text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Rango de Precio</h3>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <label className="text-xs sm:text-sm text-gray-600">Mínimo: ${priceRange.min}</label>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">Máximo: ${priceRange.max}</label>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Disponibilidad */}
        <div>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-red-500 rounded"
            />
            <span className="ml-2 text-gray-700">Solo disponibles</span>
          </label>
        </div>

        {/* Ordenamiento */}
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Ordenar por</h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
          >
            <option value="-created_at">Más recientes</option>
            <option value="price">Precio: Menor a Mayor</option>
            <option value="-price">Precio: Mayor a Menor</option>
            <option value="-rating">Mejor calificados</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
};

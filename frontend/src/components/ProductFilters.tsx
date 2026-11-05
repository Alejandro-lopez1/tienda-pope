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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Busqueda */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          className="w-full mt-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-semibold"
        >
          Buscar
        </button>
      </form>

      {/* Botón mobile */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold"
        >
          {showMobileFilters ? '✕ Cerrar Filtros' : '⚙️ Filtros'}
        </button>
      </div>

      {/* Filtros - visible en desktop siempre, en mobile solo si está abierto */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block space-y-6`}>
        {/* Categorías */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Categorías</h3>
          <div className="space-y-2">
            <label className="flex items-center">
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
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center">
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
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Rango de Precio</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Mínimo: ${priceRange.min}</label>
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
              <label className="text-sm text-gray-600">Máximo: ${priceRange.max}</label>
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
          <label className="flex items-center">
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
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Ordenar por</h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
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

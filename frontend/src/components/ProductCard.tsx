import React from 'react';
import { Link } from 'react-router-dom';
import { ProductListItem } from '../services/api';

interface ProductCardProps {
  product: ProductListItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen */}
      <div className="relative h-48 bg-gray-200 overflow-hidden group">
        <img
          src={product.image_thumbnail || '/placeholder.svg'}
          alt={product.name}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badge de descuento */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{product.discount_percentage}%
          </div>
        )}

        {/* Badge de destacado */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-bold">
            ⭐ Destacado
          </div>
        )}

        {/* Badge de stock */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Agotado</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Categoría */}
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">{product.category_name}</p>

        {/* Nombre */}
        <Link to={`/producto/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-800 hover:text-red-600 line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center mb-2">
            <span className="text-yellow-400 text-sm">{'⭐'.repeat(Math.round(product.rating))}</span>
            <span className="text-gray-500 text-xs ml-2">({product.rating.toFixed(1)})</span>
          </div>
        )}

        {/* Precios */}
        <div className="flex items-baseline gap-2 mb-3">
          {product.discount_percentage > 0 ? (
            <>
              <span className="text-lg font-bold text-gray-900">${product.discounted_price.toFixed(2)}</span>
              <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Botón */}
        <Link
          to={`/producto/${product.slug}`}
          className={`block w-full py-2 px-4 rounded font-semibold text-center text-white transition-colors ${
            product.in_stock
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {product.in_stock ? 'Ver Detalles' : 'Agotado'}
        </Link>
      </div>
    </div>
  );
};

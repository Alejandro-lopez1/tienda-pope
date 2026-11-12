import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, ProductListItem } from '../services/api';

interface ProductCardProps {
  product: ProductListItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const rating = Number(product.rating);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Imagen */}
      <div className="relative aspect-square bg-gray-200 overflow-hidden group flex-shrink-0">
        <img
          src={product.image_thumbnail || '/placeholder.svg'}
          alt={product.name}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badge de descuento */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
            -{product.discount_percentage}%
          </div>
        )}

        {/* Badge de destacado */}
        {product.is_featured && (
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-yellow-400 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold">
            ⭐ Destacado
          </div>
        )}

        {/* Badge de stock */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-sm sm:text-lg">Agotado</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {/* Categoría */}
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold mb-1 sm:mb-2">{product.category_name}</p>

        {/* Nombre */}
        <Link to={`/producto/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 hover:text-red-600 line-clamp-2 mb-1 sm:mb-2 capitalize">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center mb-1 sm:mb-2">
            <span className="text-yellow-400 text-xs sm:text-sm">{'⭐'.repeat(Math.round(rating))}</span>
            <span className="text-gray-500 text-[10px] sm:text-xs ml-1">({rating.toFixed(1)})</span>
          </div>
        )}

        {/* Precios */}
        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
          {Number(product.discount_percentage) > 0 ? (
            <>
              <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(product.discounted_price)}</span>
              <span className="text-xs sm:text-sm text-gray-500 line-through">{formatCurrency(product.price)}</span>
            </>
          ) : (
            <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
          )}
        </div>

        {/* Botón */}
        <Link
          to={`/producto/${product.slug}`}
          className={`w-full py-2 px-2 sm:px-4 rounded font-semibold text-center text-white text-xs sm:text-sm transition-colors mt-auto ${
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

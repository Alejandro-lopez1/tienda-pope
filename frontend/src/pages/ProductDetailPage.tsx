import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProducts';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const { product, loading, error } = useProductDetail(slug || '');

  const placeholder = '/placeholder.svg';
  const mainImage = product?.image || product?.image_thumbnail || placeholder;
  const thumbImage = product?.image_thumbnail || product?.image || placeholder;

  const handleAddToCart = () => {
    if (!product) return;

    // Obtener carrito actual del localStorage
    const cartString = localStorage.getItem('cart');
    const cart = cartString ? JSON.parse(cartString) : [];

    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.discounted_price || product.price,
        image: product.image_thumbnail || product.image || placeholder,
        quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Producto agregado al carrito');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error || 'Producto no encontrado'}
          </div>
          <Link to="/catalogo" className="text-red-500 hover:text-red-600 font-semibold">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-red-500">
            Inicio
          </Link>
          {' / '}
          <Link to="/catalogo" className="hover:text-red-500">
            Catálogo
          </Link>
          {' / '}
          <span className="text-gray-900 font-semibold">{product.name}</span>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6 md:p-10">
          {/* Imagen */}
          <div>
            <div className="bg-gray-200 rounded-lg overflow-hidden mb-4 h-96 flex items-center justify-center">
              <img
                src={mainImage}
                alt={product.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails (si hay múltiples imágenes en el futuro) */}
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-gray-200 rounded cursor-pointer border-2 border-red-500">
                <img src={thumbImage} alt="thumb" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Información */}
          <div>
            {/* Categoría */}
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              <Link
                to={`/catalogo?category_id=${product.category}`}
                className="hover:text-red-500"
              >
                {product.category_name || 'Categoría'}
              </Link>
            </p>

            {/* Nombre */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* SKU */}
            <p className="text-sm text-gray-600 mb-4">
              <strong>SKU:</strong> {product.sku}
            </p>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center mb-6">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(product.rating) ? '⭐' : '☆'}>
                      {i < Math.round(product.rating) ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-gray-600 text-sm">
                  {product.rating.toFixed(1)} de 5 ({product.rating_count ?? 0} reseñas)
                </span>
              </div>
            )}

            {/* Precios */}
            <div className="mb-6 pb-6 border-b-2 border-gray-200">
              {product.discount_percentage > 0 ? (
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gray-900">
                      ${product.discounted_price.toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-red-600 font-semibold mt-2">
                    ¡Ahorra {product.discount_percentage}%!
                  </p>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6 pb-6 border-b-2 border-gray-200">
              {product.in_stock ? (
                <div className="flex items-center text-green-600 font-semibold">
                  <span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                  Stock disponible ({product.stock} unidades)
                </div>
              ) : (
                <div className="flex items-center text-red-600 font-semibold">
                  <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                  Agotado
                </div>
              )}
            </div>

            {/* Cantidad y Agregar al carrito */}
            {product.in_stock && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.stock}
                    className="w-16 px-3 py-2 border border-gray-300 rounded text-center"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition-colors"
                >
                  🛒 Agregar al Carrito
                </button>
              </div>
            )}

            {/* Descripción */}
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del Producto</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Características adicionales */}
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Categoría</h3>
                  <p className="text-gray-900">{product.category_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Stock Disponible</h3>
                  <p className="text-gray-900">{product.in_stock ? `${product.stock} unidades` : 'Agotado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link de volver */}
        <div className="mt-8">
          <Link
            to="/catalogo"
            className="text-red-500 hover:text-red-600 font-semibold text-lg"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { apiService, Product, ProductListItem, PaginatedResponse, SearchParams } from '../services/api';

interface UseProductsResult {
  products: ProductListItem[];
  total: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function useProducts(initialPage: number = 1): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getProducts(currentPage);
        setProducts(data.results);
        setTotal(data.count);
        setHasNext(!!data.next);
        setHasPrevious(!!data.previous);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar productos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  return { products, total, loading, error, currentPage, hasNext, hasPrevious };
}

interface UseProductDetailResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export function useProductDetail(productId: number | string): UseProductDetailResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getProduct(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}

interface UseProductSearchResult extends UseProductsResult {}

export function useProductSearch(params: SearchParams): UseProductSearchResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.searchProducts({ ...params, page: currentPage });
        setProducts(data.results);
        setTotal(data.count);
        setHasNext(!!data.next);
        setHasPrevious(!!data.previous);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error en la búsqueda');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [JSON.stringify(params), currentPage]);

  return { products, total, loading, error, currentPage, hasNext, hasPrevious };
}

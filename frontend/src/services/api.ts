import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  order: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  sku: string;
  price: number;
  discount_percentage: number;
  discounted_price: number;
  image: string;
  image_thumbnail: string;
  stock: number;
  in_stock: boolean;
  is_featured: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  price: number;
  discounted_price: number;
  discount_percentage: number;
  image_thumbnail: string;
  stock: number;
  in_stock: boolean;
  is_featured: boolean;
  rating: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface SearchParams {
  q?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  page?: number;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Agregar token JWT si existe
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ===== Categories =====

  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<Category[]>('/categories/');
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await this.api.get<Category>(`/categories/${id}/`);
    return response.data;
  }

  // ===== Products =====

  async getProducts(page: number = 1): Promise<PaginatedResponse<ProductListItem>> {
    const response = await this.api.get<PaginatedResponse<ProductListItem>>('/products/', {
      params: { page },
    });
    return response.data;
  }

  async getProduct(id: number | string): Promise<Product> {
    const response = await this.api.get<Product>(`/products/${id}/`);
    return response.data;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    // Buscar por slug mediante listado (Django REST Framework no tiene endpoint directo)
    // En producción, considerar agregar un endpoint /products/by-slug/{slug}/
    const response = await this.api.get<PaginatedResponse<Product>>('/products/', {
      params: { search: slug },
    });
    const product = response.data.results.find((p) => p.slug === slug);
    if (!product) throw new Error('Producto no encontrado');
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await this.api.get<Product[]>('/products/featured/');
    return response.data;
  }

  async searchProducts(params: SearchParams): Promise<PaginatedResponse<ProductListItem>> {
    const queryParams: Record<string, unknown> = {};

    if (params.q) queryParams.q = params.q;
    if (params.category_id) queryParams.category_id = params.category_id;
    if (params.min_price !== undefined) queryParams.min_price = params.min_price;
    if (params.max_price !== undefined) queryParams.max_price = params.max_price;
    if (params.in_stock !== undefined) queryParams.in_stock = params.in_stock;
    if (params.sort) queryParams.sort = params.sort;
    if (params.page) queryParams.page = params.page;

    const response = await this.api.get<PaginatedResponse<ProductListItem>>('/products/search/', {
      params: queryParams,
    });
    return response.data;
  }

  async getProductsByCategory(
    categoryId: number,
    page: number = 1,
  ): Promise<PaginatedResponse<ProductListItem>> {
    const response = await this.api.get<PaginatedResponse<ProductListItem>>(
      '/products/by_category/',
      {
        params: { category_id: categoryId, page },
      },
    );
    return response.data;
  }
}

export const apiService = new ApiService();
export type { Category, Product, ProductListItem, PaginatedResponse, SearchParams };

/**
 * Formatea un número como moneda en pesos argentinos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

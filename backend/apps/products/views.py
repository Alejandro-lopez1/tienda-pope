from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Product
from .serializers import ProductSerializer, ProductListSerializer, ProductDetailSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para productos del catálogo.
    
    Endpoints:
    - GET /api/v1/products/ - Listar productos
    - POST /api/v1/products/ - Crear producto (admin)
    - GET /api/v1/products/{id|slug}/ - Detalle de producto (por id numérico o slug)
    - PATCH /api/v1/products/{id|slug}/ - Actualizar producto (admin)
    - DELETE /api/v1/products/{id|slug}/ - Eliminar producto (admin)
    - GET /api/v1/products/search/ - Búsqueda avanzada
    - GET /api/v1/products/featured/ - Productos destacados
    """
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'price', 'rating', 'created_at']
    filterset_fields = ['category', 'is_active', 'is_featured']

    def get_serializer_class(self):
        """Usar serializador apropiado según la acción."""
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def get_object(self):
        """Resolver por pk numérico o por slug, respetando get_queryset()."""
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if str(lookup_value).isdigit():
            obj = get_object_or_404(queryset, pk=lookup_value)
        else:
            obj = get_object_or_404(queryset, slug=lookup_value)
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        """
        Permitir ver productos inactivos solo a admins.
        Público solo ve productos activos.
        """
        if self.request.user and self.request.user.is_staff:
            return Product.objects.all().select_related('category')
        return Product.objects.filter(is_active=True).select_related('category')

    def perform_create(self, serializer):
        """Solo administradores pueden crear productos."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden crear productos")
        serializer.save()

    def perform_update(self, serializer):
        """Solo administradores pueden actualizar productos."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden actualizar productos")
        serializer.save()

    def perform_destroy(self, instance):
        """Solo administradores pueden eliminar productos."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden eliminar productos")
        instance.delete()

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener productos destacados."""
        featured_products = self.get_queryset().filter(is_featured=True)[:10]
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Búsqueda avanzada con filtros.
        Parámetros opcionales:
        - q: Término de búsqueda
        - category_id: ID de categoría
        - min_price: Precio mínimo
        - max_price: Precio máximo
        - in_stock: Solo con stock (true/false)
        - sort: Campo para ordenar (price, rating, name)
        """
        queryset = self.get_queryset()
        
        # Búsqueda por texto
        search_query = request.query_params.get('q', '')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(sku__icontains=search_query)
            )
        
        # Filtro por categoría
        category_id = request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filtro por precio
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filtro por stock
        in_stock = request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        # Ordenamiento
        sort = request.query_params.get('sort', '-created_at')
        valid_sorts = ['price', '-price', 'rating', '-rating', 'name', '-name', 'created_at', '-created_at']
        if sort in valid_sorts:
            queryset = queryset.order_by(sort)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Obtener productos por categoría."""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'category_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(category_id=category_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Alternar estado destacado (solo admin)."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden cambiar esto'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        product = self.get_object()
        product.is_featured = not product.is_featured
        product.save()
        
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

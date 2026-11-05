from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Category
from .serializers import CategorySerializer, CategoryListSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para categorías de productos.
    
    Endpoints:
    - GET /api/v1/categories/ - Listar todas las categorías
    - POST /api/v1/categories/ - Crear nueva categoría (admin)
    - GET /api/v1/categories/{id}/ - Detalle de categoría
    - PATCH /api/v1/categories/{id}/ - Actualizar categoría (admin)
    - DELETE /api/v1/categories/{id}/ - Eliminar categoría (admin)
    """
    queryset = Category.objects.filter(is_active=True).order_by('order')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    filterset_fields = ['is_active']

    def get_serializer_class(self):
        """Usar serializador simplificado para listados."""
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer

    def get_queryset(self):
        """
        Permitir ver categorías inactivas solo a admins.
        Público solo ve categorías activas.
        """
        if self.request.user and self.request.user.is_staff:
            return Category.objects.all().order_by('order')
        return Category.objects.filter(is_active=True).order_by('order')

    def perform_create(self, serializer):
        """Solo administradores pueden crear categorías."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden crear categorías")
        serializer.save()

    def perform_update(self, serializer):
        """Solo administradores pueden actualizar categorías."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden actualizar categorías")
        serializer.save()

    def perform_destroy(self, instance):
        """Solo administradores pueden eliminar categorías."""
        if not self.request.user.is_staff:
            raise PermissionError("Solo administradores pueden eliminar categorías")
        instance.delete()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Obtener solo categorías activas."""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar o desactivar una categoría (solo admin)."""
        if not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden cambiar el estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        category = self.get_object()
        category.is_active = not category.is_active
        category.save()
        
        serializer = self.get_serializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

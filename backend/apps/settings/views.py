from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.auth.permissions import IsAdminUser
from .models import StoreSettings
from .serializers import StoreSettingsSerializer, StoreSettingsPublicSerializer


class StoreSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet para configuración de la tienda (singleton).
    
    Endpoints:
    - GET /api/v1/store-settings/ - Público (campos públicos solamente)
    - PATCH /api/v1/store-settings/1/ - Admin only
    - PUT /api/v1/store-settings/1/ - Admin only
    """
    
    def list(self, request):
        """GET /api/v1/store-settings/ - Público."""
        obj = StoreSettings.get_or_create_default()
        if request.user and request.user.is_staff:
            serializer = StoreSettingsSerializer(obj)
        else:
            serializer = StoreSettingsPublicSerializer(obj)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """GET /api/v1/store-settings/1/ - Público."""
        obj = StoreSettings.get_or_create_default()
        if request.user and request.user.is_staff:
            serializer = StoreSettingsSerializer(obj)
        else:
            serializer = StoreSettingsPublicSerializer(obj)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """PUT /api/v1/store-settings/1/ - Admin only."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden actualizar la configuración'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        obj = StoreSettings.get_or_create_default()
        serializer = StoreSettingsSerializer(obj, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """PATCH /api/v1/store-settings/1/ - Admin only."""
        if not request.user or not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden actualizar la configuración'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        obj = StoreSettings.get_or_create_default()
        serializer = StoreSettingsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

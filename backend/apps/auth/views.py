from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User

from .models import AdminUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    AdminUserSerializer,
    LoginSerializer,
)


class LoginView(TokenObtainPairView):
    """
    Vista personalizada de login que retorna tokens + información del usuario.
    
    Endpoint: POST /api/v1/auth/login/
    
    Body:
    {
        "username": "admin@example.com",
        "password": "password123"
    }
    
    Response:
    {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "is_active": true
        }
    }
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet para administradores."""
    
    queryset = AdminUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar solo administradores activos."""
        return AdminUser.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario actual."""
        try:
            admin_user = request.user.admin_profile
            serializer = self.get_serializer(admin_user)
            return Response(serializer.data)
        except AdminUser.DoesNotExist:
            return Response(
                {'error': 'No tiene acceso al panel de administración'},
                status=status.HTTP_403_FORBIDDEN
            )

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Logout (invalidar token en cliente).
        En JWT, el logout se realiza eliminando el token del cliente.
        """
        return Response(
            {'message': 'Sesión cerrada exitosamente'},
            status=status.HTTP_200_OK
        )


class AuthViewSet(viewsets.ViewSet):
    """ViewSet para operaciones de autenticación."""
    
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        Login alternativo con email o username.
        
        Endpoint: POST /api/v1/auth/login/
        """
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        admin_profile = serializer.validated_data['admin_profile']

        # Generar tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': AdminUserSerializer(admin_profile).data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Refrescar token de acceso."""
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario autenticado."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'No autenticado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            admin_profile = request.user.admin_profile
            serializer = AdminUserSerializer(admin_profile)
            return Response(serializer.data)
        except AdminUser.DoesNotExist:
            return Response(
                {'error': 'Perfil de administrador no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

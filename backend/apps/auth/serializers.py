from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import AdminUser


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializador para AdminUser con información del usuario Django."""
    
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'avatar_url', 'is_active', 'created_at'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador personalizado para login.
    Retorna token + información del usuario admin.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar información al token
        token['username'] = user.username
        token['email'] = user.email
        
        # Verificar si es admin
        if hasattr(user, 'admin_profile'):
            token['role'] = user.admin_profile.role
            token['is_admin'] = user.admin_profile.is_superadmin
        
        return token

    def validate(self, attrs):
        """Validar credenciales y retornar tokens + user info."""
        data = super().validate(attrs)
        
        user = self.user
        
        # Verificar que el usuario sea admin
        if not hasattr(user, 'admin_profile') or not user.admin_profile.is_active:
            raise serializers.ValidationError(
                "Este usuario no tiene acceso al panel de administración."
            )
        
        # Agregar información del usuario
        admin_user = user.admin_profile
        data['user'] = AdminUserSerializer(admin_user).data
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializador para login con email o username."""
    
    email_or_username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email_or_username = attrs.get('email_or_username')
        password = attrs.get('password')

        # Buscar usuario por email o username
        try:
            user = User.objects.get(
                email=email_or_username
            ) if '@' in email_or_username else User.objects.get(
                username=email_or_username
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Credenciales inválidas."
            )

        # Verificar contraseña
        if not user.check_password(password):
            raise serializers.ValidationError(
                "Credenciales inválidas."
            )

        # Verificar acceso admin
        if not hasattr(user, 'admin_profile') or not user.admin_profile.is_active:
            raise serializers.ValidationError(
                "Este usuario no tiene acceso al panel de administración."
            )

        return {
            'user': user,
            'admin_profile': user.admin_profile
        }

from rest_framework.permissions import BasePermission
from .models import AdminUser


class IsAdminUser(BasePermission):
    """
    Permiso personalizado que verifica si el usuario es admin.
    Requiere que el usuario tenga un perfil AdminUser activo.
    """
    
    message = 'Solo administradores pueden realizar esta acción.'
    
    def has_permission(self, request, view):
        """
        Verifica si el usuario autenticado es admin.
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verificar que tenga perfil AdminUser activo
        try:
            admin_user = request.user.admin_profile
            return admin_user.is_active
        except AdminUser.DoesNotExist:
            return False

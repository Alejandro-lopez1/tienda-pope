from django.contrib.auth.models import User as DjangoUser
from django.db import models


class AdminUser(models.Model):
    """
    Modelo extendido para usuarios administradores.
    Extiende el User de Django con información adicional.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('staff', 'Personal'),
        ('viewer', 'Visualizador'),
    ]

    user = models.OneToOneField(
        DjangoUser,
        on_delete=models.CASCADE,
        related_name='admin_profile',
        help_text="Usuario de Django"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='staff',
        help_text="Rol de administrador"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Teléfono del administrador"
    )
    avatar_url = models.URLField(
        blank=True,
        help_text="URL de avatar"
    )
    last_login_ip = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="Última IP de login"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="¿El administrador está activo?"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Administrador'
        verbose_name_plural = 'Administradores'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"

    @property
    def is_superadmin(self):
        return self.role == 'admin'

    @property
    def is_staff_member(self):
        return self.role in ['admin', 'staff']

import re
from django.db import models
from django.core.exceptions import ValidationError


def validate_whatsapp_number(value):
    """Valida que el número sea solo dígitos, 10+ caracteres (formato internacional)."""
    if not value:
        return  # Permitir vacío (opcional)
    if not re.match(r'^\d{10,}$', str(value)):
        raise ValidationError(
            'El número debe ser solo dígitos en formato internacional (ej: 5493764710683, mínimo 10 dígitos).'
        )


class StoreSettings(models.Model):
    """
    Configuración singleton de la tienda.
    Solo una fila debe existir. Acceso:
    - GET público: campos públicos solamente
    - PATCH/PUT: solo IsAdminUser
    """
    
    # Información pública de la tienda
    store_name = models.CharField(
        max_length=150,
        default='Popé',
        help_text='Nombre de la tienda (mostrado en catálogo, recibos, etc.)'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        help_text='Email de contacto (opcional, mostrado en pie de página)'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Teléfono de contacto (formato: + y dígitos, ej: +54 9 3764 71-0683)'
    )
    whatsapp_number = models.CharField(
        max_length=20,
        validators=[validate_whatsapp_number],
        blank=True,
        default='',
        help_text='Número de WhatsApp en formato internacional sin +: ej 5493764710683'
    )
    address = models.TextField(
        blank=True,
        default='',
        help_text='Dirección de la tienda (mostrada en pie de página)'
    )
    delivery_zones = models.TextField(
        blank=True,
        default='',
        help_text='Información sobre zonas de entrega (mostrada en carrito/checkout)'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuración de la Tienda'
        verbose_name_plural = 'Configuración de la Tienda'
    
    def __str__(self):
        return f"Configuración - {self.store_name}"
    
    def save(self, *args, **kwargs):
        """Asegurar que solo exista una fila (singleton)."""
        # Si es la primera vez, verificar que no exista otra
        if self.pk is None and StoreSettings.objects.exists():
            # Actualizar la existente en lugar de crear nueva
            existing = StoreSettings.objects.first()
            self.pk = existing.pk
        super().save(*args, **kwargs)
    
    @staticmethod
    def get_or_create_default():
        """Obtener o crear la configuración por defecto (singleton)."""
        obj, created = StoreSettings.objects.get_or_create(
            pk=1,
            defaults={
                'store_name': 'Popé',
                'email': '',
                'phone': '',
                'whatsapp_number': '',
                'address': '',
                'delivery_zones': '',
            }
        )
        return obj
    
    def get_public_fields(self):
        """Retornar solo los campos públicos (sin datos sensibles)."""
        return {
            'store_name': self.store_name,
            'email': self.email,
            'phone': self.phone,
            'whatsapp_number': self.whatsapp_number,
            'address': self.address,
            'delivery_zones': self.delivery_zones,
        }

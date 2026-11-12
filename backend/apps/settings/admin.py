from django.contrib import admin
from .models import StoreSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Información General', {
            'fields': ('store_name', 'email', 'phone')
        }),
        ('WhatsApp', {
            'fields': ('whatsapp_number',),
            'description': 'Número sin + en formato internacional (ej: 5493764710683)'
        }),
        ('Ubicación y Entregas', {
            'fields': ('address', 'delivery_zones')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        """Solo puede existir una instancia."""
        return not StoreSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar la configuración."""
        return False

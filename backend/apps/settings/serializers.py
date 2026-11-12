from rest_framework import serializers
from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):
    """Serializer completo para StoreSettings (admin only)."""
    
    class Meta:
        model = StoreSettings
        fields = [
            'id',
            'store_name',
            'email',
            'phone',
            'whatsapp_number',
            'address',
            'delivery_zones',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StoreSettingsPublicSerializer(serializers.ModelSerializer):
    """Serializer público - solo campos públicos (sin datos sensibles)."""
    
    class Meta:
        model = StoreSettings
        fields = [
            'store_name',
            'email',
            'phone',
            'whatsapp_number',
            'address',
            'delivery_zones',
        ]

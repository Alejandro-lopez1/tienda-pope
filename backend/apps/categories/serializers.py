from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializador para categorías."""
    
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'image',
            'is_active',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializador simplificado para listados."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'order']

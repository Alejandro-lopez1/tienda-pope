from rest_framework import serializers
from .models import Product
from apps.categories.serializers import CategoryListSerializer


class ProductSerializer(serializers.ModelSerializer):
    """Serializador completo para productos."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'category',
            'category_name',
            'sku',
            'price',
            'discounted_price',
            'discount_percentage',
            'image',
            'image_thumbnail',
            'stock',
            'in_stock',
            'is_active',
            'is_featured',
            'rating',
            'rating_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'slug',
            'image_thumbnail',
            'created_at',
            'updated_at',
            'discounted_price',
            'in_stock',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Serializador simplificado para listados."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'category_name',
            'price',
            'discounted_price',
            'discount_percentage',
            'image_thumbnail',
            'stock',
            'in_stock',
            'is_featured',
            'rating',
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializador detallado para vista individual."""
    category = CategoryListSerializer(read_only=True)
    discounted_price = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'category',
            'sku',
            'price',
            'discounted_price',
            'discount_percentage',
            'image',
            'image_thumbnail',
            'stock',
            'in_stock',
            'is_active',
            'is_featured',
            'rating',
            'rating_count',
            'created_at',
            'updated_at',
        ]

from django.contrib import admin
from django.utils.html import format_html
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'sku',
        'category',
        'price_display',
        'stock',
        'is_featured',
        'is_active',
        'rating_display',
        'created_at'
    )
    list_filter = ('is_active', 'is_featured', 'category', 'created_at')
    search_fields = ('name', 'sku', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'slug', 'image_preview', 'rating_count')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'slug', 'sku', 'category', 'description'),
        }),
        ('Precios y Descuentos', {
            'fields': ('price', 'discount_percentage'),
        }),
        ('Imágenes', {
            'fields': ('image', 'image_thumbnail', 'image_preview'),
        }),
        ('Inventario', {
            'fields': ('stock',),
        }),
        ('Visibilidad', {
            'fields': ('is_active', 'is_featured'),
        }),
        ('Valoración', {
            'fields': ('rating', 'rating_count'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def price_display(self, obj):
        """Mostrar precio con descuento."""
        if obj.discount_percentage > 0:
            return format_html(
                '<span style="text-decoration: line-through;">${}</span> <strong>${}</strong>',
                obj.price,
                obj.discounted_price
            )
        return f'${obj.price}'
    price_display.short_description = 'Precio'

    def rating_display(self, obj):
        """Mostrar calificación."""
        if obj.rating > 0:
            return f'{obj.rating}⭐ ({obj.rating_count})'
        return '-'
    rating_display.short_description = 'Calificación'

    def image_preview(self, obj):
        """Vista previa de imagen."""
        if obj.image:
            return format_html(
                '<img src="{}" width="200" style="max-width: 100%; height: auto;" />',
                obj.image.url
            )
        return 'Sin imagen'
    image_preview.short_description = 'Vista previa'

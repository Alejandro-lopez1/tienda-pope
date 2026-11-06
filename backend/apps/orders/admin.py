from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'subtotal', 'discount_amount', 'total')
    fields = ('product', 'quantity', 'price', 'discount_percentage', 'subtotal', 'discount_amount', 'total')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer_name', 'status', 'total', 'payment_method', 'paid', 'created_at')
    list_filter = ('status', 'payment_method', 'paid', 'created_at')
    search_fields = ('order_number', 'customer_name', 'customer_phone')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'item_count')
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('order_number', 'status', 'created_at', 'updated_at'),
        }),
        ('Cliente', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'customer_address'),
        }),
        ('Totales', {
            'fields': ('subtotal', 'discount_amount', 'total', 'item_count'),
        }),
        ('Pago', {
            'fields': ('payment_method', 'paid', 'paid_at'),
        }),
        ('Notas', {
            'fields': ('notes',),
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price', 'discount_percentage', 'total')
    list_filter = ('order__created_at', 'product')
    search_fields = ('order__order_number', 'product__name')
    readonly_fields = ('order', 'product', 'subtotal', 'discount_amount', 'total')

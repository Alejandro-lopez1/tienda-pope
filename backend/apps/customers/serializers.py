from rest_framework import serializers
from apps.orders.models import Order
from django.db.models import Count, Sum, Avg, Q, Max


class CustomerSerializer(serializers.Serializer):
    """Serializador para lista de clientes con estadísticas agregadas."""
    customer_email = serializers.EmailField()
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField()
    customer_address = serializers.CharField(required=False, allow_blank=True)
    total_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    paid_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    last_order_date = serializers.DateTimeField()


class CustomerDetailSerializer(serializers.Serializer):
    """Serializador detallado para un cliente específico."""
    customer_email = serializers.EmailField()
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField()
    customer_address = serializers.CharField(required=False, allow_blank=True)
    total_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    paid_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    shipped_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    last_order_date = serializers.DateTimeField()
    first_order_date = serializers.DateTimeField()
    orders = serializers.SerializerMethodField()

    def get_orders(self, obj):
        """Obtener últimas 5 órdenes del cliente."""
        from apps.orders.serializers import OrderSerializer
        
        orders = Order.objects.filter(
            customer_email=obj['customer_email']
        ).order_by('-created_at')[:5]
        
        return OrderSerializer(orders, many=True).data

from rest_framework import serializers


class CustomerSerializer(serializers.Serializer):
    """Serializador para lista de clientes (agrupados por teléfono)."""

    customer_phone = serializers.CharField()
    customer_name = serializers.CharField(allow_blank=True, required=False)
    customer_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    total_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    last_order_date = serializers.DateTimeField(allow_null=True)
    first_order_date = serializers.DateTimeField(allow_null=True, required=False)

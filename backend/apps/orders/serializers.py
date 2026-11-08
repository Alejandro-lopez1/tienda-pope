from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializador para ítems de pedido."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image_thumbnail', read_only=True)
    subtotal = serializers.ReadOnlyField()
    discount_amount = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_image',
            'quantity',
            'price',
            'discount_percentage',
            'subtotal',
            'discount_amount',
            'total',
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Serializador completo para pedidos."""
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_address',
            'subtotal',
            'discount_amount',
            'total',
            'payment_method',
            'paid',
            'notes',
            'items',
            'item_count',
            'created_at',
            'updated_at',
            'paid_at',
        ]
        read_only_fields = [
            'id',
            'order_number',
            'created_at',
            'updated_at',
            'item_count',
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Serializador simplificado para listados."""
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'customer_name',
            'total',
            'item_count',
            'created_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Serializador para crear pedidos desde el carrito."""

    customer_name = serializers.CharField(max_length=150)
    customer_phone = serializers.CharField(max_length=20)
    customer_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    customer_address = serializers.CharField(max_length=500)
    payment_method = serializers.ChoiceField(
        choices=[('cash', 'Efectivo'), ('transfer', 'Transferencia'), ('whatsapp', 'WhatsApp Pay')]
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    # Carrito
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text="Array de ítems del carrito",
    )

    def validate_customer_phone(self, value):
        from .utils import normalize_phone

        normalized = normalize_phone(value)
        if not normalized:
            raise serializers.ValidationError("El teléfono es inválido.")
        return normalized

    def validate_items(self, value):
        """Validar que items no esté vacío."""
        if not value or len(value) == 0:
            raise serializers.ValidationError("El carrito no puede estar vacío")
        return value

    def create(self, validated_data):
        """Crear pedido con ítems."""
        items_data = validated_data.pop('items')

        # Calcular totales
        subtotal = 0
        order_items = []

        for item_data in items_data:
            product_id = item_data.get('id')
            quantity = item_data.get('quantity', 1)

            try:
                from apps.products.models import Product
                product = Product.objects.get(id=product_id)

                # Usar precio con descuento si existe
                price = product.discounted_price if product.discount_percentage > 0 else product.price
                item_total = price * quantity
                subtotal += item_total

                order_items.append({
                    'product': product,
                    'quantity': quantity,
                    'price': price,
                    'discount_percentage': product.discount_percentage,
                })
            except Exception:
                continue

        # Crear pedido
        order = Order.objects.create(
            customer_name=validated_data['customer_name'],
            customer_phone=validated_data['customer_phone'],
            customer_email=validated_data.get('customer_email') or '',
            customer_address=validated_data.get('customer_address') or '',
            payment_method=validated_data['payment_method'],
            notes=validated_data.get('notes', ''),
            subtotal=subtotal,
            total=subtotal,
        )

        # Crear ítems del pedido
        for item_data in order_items:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price=item_data['price'],
                discount_percentage=item_data['discount_percentage'],
            )

        return order

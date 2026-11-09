from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.products.serializers import ProductListSerializer

from .models import Order, OrderItem
from .utils import generate_order_number

MAX_ITEM_QUANTITY = 99


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
            'status',
            'paid',
            'paid_at',
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
            'customer_phone',
            'total',
            'payment_method',
            'paid',
            'paid_at',
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
        """Crear pedido con ítems (transaccional, anti-sobreventa, reintento por colisión)."""
        from django.db.models import F

        from apps.products.models import Product

        items_data = validated_data.pop('items')
        requested = {}
        errors = []
        for idx, item_data in enumerate(items_data):
            product_id = item_data.get('id')
            try:
                quantity = int(item_data.get('quantity', 1))
            except (TypeError, ValueError):
                errors.append(f"Ítem {idx}: cantidad inválida.")
                continue
            if quantity < 1 or quantity > MAX_ITEM_QUANTITY:
                errors.append(f"Ítem {idx}: la cantidad debe estar entre 1 y {MAX_ITEM_QUANTITY}.")
                continue
            if product_id is None:
                errors.append(f"Ítem {idx}: falta id de producto.")
                continue
            try:
                pid = int(product_id)
            except (TypeError, ValueError):
                errors.append(f"Ítem {idx}: id de producto inválido.")
                continue
            requested[pid] = requested.get(pid, 0) + quantity

        if errors:
            raise serializers.ValidationError({"items": errors})
        if not requested:
            raise serializers.ValidationError({"items": ["No hay ítems válidos en el carrito."]})
        for pid, qty in requested.items():
            if qty > MAX_ITEM_QUANTITY:
                raise serializers.ValidationError({"items": [f"Producto {pid}: cantidad total excede {MAX_ITEM_QUANTITY}."]})

        last_err = None
        for _ in range(5):
            try:
                with transaction.atomic():
                    locked = list(
                        Product.objects.select_for_update()
                        .order_by('id')
                        .filter(id__in=requested.keys(), is_active=True)
                    )
                    found = {p.id: p for p in locked}
                    missing = [pid for pid in requested if pid not in found]
                    if missing:
                        raise serializers.ValidationError({"items": [f"Producto(s) no disponible(s): {missing}"]})
                    stock_errors = []
                    for pid, qty in requested.items():
                        p = found[pid]
                        if hasattr(p, 'stock') and p.stock < qty:
                            stock_errors.append(f"Stock insuficiente para {getattr(p, 'name', pid)}.")
                    if stock_errors:
                        raise serializers.ValidationError({"items": stock_errors})

                    subtotal = 0
                    order_items = []
                    for pid, qty in requested.items():
                        p = found[pid]
                        price = p.discounted_price if getattr(p, 'discount_percentage', 0) else p.price
                        subtotal += price * qty
                        order_items.append({
                            'product': p,
                            'quantity': qty,
                            'price': price,
                            'discount_percentage': getattr(p, 'discount_percentage', 0) or 0,
                        })
                        if hasattr(p, 'stock'):
                            updated = Product.objects.filter(id=pid, stock__gte=qty).update(stock=F('stock') - qty)
                            if updated != 1:
                                raise serializers.ValidationError({"items": [f"Stock insuficiente para {getattr(p, 'name', pid)}."]})

                    order = Order.objects.create(
                        order_number=generate_order_number(),
                        customer_name=validated_data['customer_name'],
                        customer_phone=validated_data['customer_phone'],
                        customer_email=validated_data.get('customer_email') or '',
                        customer_address=validated_data.get('customer_address') or '',
                        payment_method=validated_data['payment_method'],
                        notes=validated_data.get('notes', ''),
                        subtotal=subtotal,
                        total=subtotal,
                    )
                    OrderItem.objects.bulk_create([
                        OrderItem(order=order, **item_data) for item_data in order_items
                    ])
                return order
            except IntegrityError as err:
                last_err = err
                continue
            except serializers.ValidationError:
                raise
        raise serializers.ValidationError(
            {"non_field_errors": ["No se pudo generar el pedido. Intentá nuevamente."]}
        ) from last_err

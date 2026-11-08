from django.db import models
from django.utils import timezone
from decimal import Decimal

from apps.products.models import Product


class Order(models.Model):
    """
    Modelo para pedidos de clientes.
    """
    ORDER_STATUS = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    ]

    PAYMENT_METHOD = [
        ('cash', 'Efectivo'),
        ('transfer', 'Transferencia'),
        ('whatsapp', 'WhatsApp Pay'),
    ]

    # Información del pedido
    order_number = models.CharField(
        max_length=32,
        unique=True,
        help_text="Identificador único del pedido (alta entropía, usado en confirmación)"
    )
    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS,
        default='pending',
        help_text="Estado actual del pedido"
    )
    
    # Información del cliente
    customer_name = models.CharField(
        max_length=150,
        help_text="Nombre del cliente"
    )
    customer_phone = models.CharField(
        max_length=20,
        help_text="Teléfono del cliente"
    )
    customer_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email del cliente (opcional)"
    )
    customer_address = models.TextField(
        blank=True,
        null=True,
        help_text="Dirección de entrega (opcional)"
    )
    
    # Totales
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Subtotal antes de descuentos"
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Monto de descuento aplicado"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total del pedido"
    )
    
    # Pago
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD,
        default='cash',
        help_text="Método de pago"
    )
    paid = models.BooleanField(
        default=False,
        help_text="¿Está pagado?"
    )
    
    # Notas
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notas adicionales del pedido"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha de pago"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        # Auto-generar número de pedido si es nuevo (fallback; la API usa serializer+retry)
        if not self.order_number:
            from .utils import generate_order_number

            self.order_number = generate_order_number()
        super().save(*args, **kwargs)

    @property
    def item_count(self):
        """Cantidad total de ítems en el pedido."""
        return self.items.aggregate(models.Sum('quantity'))['quantity__sum'] or 0


class OrderItem(models.Model):
    """
    Modelo para ítems individuales dentro de un pedido.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        help_text="Pedido al que pertenece este ítem"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        help_text="Producto en el pedido"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Cantidad del producto"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Precio unitario al momento de compra"
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Descuento aplicado al producto"
    )
    
    class Meta:
        unique_together = ['order', 'product']
        verbose_name = 'Ítem de Pedido'
        verbose_name_plural = 'Ítems de Pedido'

    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.order.order_number}"

    @property
    def subtotal(self):
        """Subtotal sin descuento: price * quantity."""
        return self.price * self.quantity

    @property
    def discount_amount(self):
        """Monto de descuento aplicado."""
        if self.discount_percentage > 0:
            return self.subtotal * (self.discount_percentage / 100)
        return Decimal('0.00')

    @property
    def total(self):
        """Total con descuento: subtotal - discount."""
        return self.subtotal - self.discount_amount

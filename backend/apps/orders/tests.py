from django.test import TestCase
from django.utils import timezone
from decimal import Decimal

from apps.categories.models import Category
from apps.products.models import Product
from .models import Order, OrderItem


class OrderModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Limpiadores')
        self.product = Product.objects.create(
            name='Desinfectante',
            sku='DES-001',
            category=self.category,
            description='Desinfectante de prueba',
            price=Decimal('250.00'),
            stock=100
        )
        self.order = Order.objects.create(
            customer_name='Juan Pérez',
            customer_phone='+54 376 123-4567',
            payment_method='cash',
            subtotal=Decimal('500.00'),
            total=Decimal('500.00'),
        )

    def test_order_creation(self):
        self.assertEqual(self.order.customer_name, 'Juan Pérez')
        self.assertTrue(self.order.order_number.startswith('ORD-'))
        self.assertEqual(self.order.status, 'pending')
        self.assertFalse(self.order.paid)

    def test_order_number_generation(self):
        order2 = Order.objects.create(
            customer_name='María García',
            customer_phone='+54 376 987-6543',
            subtotal=Decimal('300.00'),
            total=Decimal('300.00'),
        )
        self.assertNotEqual(self.order.order_number, order2.order_number)

    def test_order_item_creation(self):
        item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=Decimal('250.00'),
        )
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.subtotal, Decimal('500.00'))
        self.assertEqual(item.total, Decimal('500.00'))

    def test_order_item_discount(self):
        item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price=Decimal('250.00'),
            discount_percentage=Decimal('10'),
        )
        self.assertEqual(item.subtotal, Decimal('500.00'))
        self.assertEqual(item.discount_amount, Decimal('50.00'))
        self.assertEqual(item.total, Decimal('450.00'))

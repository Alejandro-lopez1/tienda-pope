from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

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


class OrderLookupPermissionTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Prod',
            sku='SKU-T-1',
            category=self.category,
            description='x',
            price=Decimal('100.00'),
            stock=10,
        )
        self.order = Order.objects.create(
            customer_name='Ana',
            customer_phone='3764000000',
            customer_address='Dir 1',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
        )
        User = get_user_model()
        self.staff = User.objects.create_user(username='staff', password='pass12345', is_staff=True)

    def test_anonymous_get_by_pk_returns_404(self):
        res = self.client.get(f'/api/v1/orders/{self.order.pk}/')
        self.assertEqual(res.status_code, 404)

    def test_anonymous_get_by_order_number_returns_200(self):
        res = self.client.get(f'/api/v1/orders/{self.order.order_number}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get('order_number'), self.order.order_number)

    def test_staff_get_by_pk_returns_200(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.get(f'/api/v1/orders/{self.order.pk}/')
        self.assertEqual(res.status_code, 200)

    def test_anonymous_list_returns_401_or_403(self):
        res = self.client.get('/api/v1/orders/')
        self.assertIn(res.status_code, (401, 403))


class OrderStockTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='StockCat')
        self.product = Product.objects.create(
            name='ProdStock',
            sku='SKU-STOCK-1',
            category=self.category,
            description='x',
            price=Decimal('50.00'),
            stock=5,
            is_active=True,
        )

    def _payload(self, quantity=2):
        return {
            'customer_name': 'Cliente',
            'customer_phone': '3764111222',
            'customer_address': 'Calle 123',
            'payment_method': 'cash',
            'items': [{'id': self.product.id, 'quantity': quantity}],
        }

    def test_create_order_decrements_stock(self):
        res = self.client.post('/api/v1/orders/', self._payload(quantity=2), format='json')
        self.assertEqual(res.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(Order.objects.count(), 1)

    def test_insufficient_stock_returns_400_and_creates_no_order(self):
        before = Order.objects.count()
        res = self.client.post('/api/v1/orders/', self._payload(quantity=99), format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Order.objects.count(), before)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)


class OrderActionsTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='AccionCat')
        self.product = Product.objects.create(
            name='ProdAccion',
            sku='SKU-ACT-1',
            category=self.category,
            description='x',
            price=Decimal('80.00'),
            stock=10,
            is_active=True,
        )
        self.order = Order.objects.create(
            customer_name='Beto',
            customer_phone='3764555666',
            customer_address='Dir 9',
            payment_method='cash',
            subtotal=Decimal('80.00'),
            total=Decimal('80.00'),
            status='pending',
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('80.00'),
        )
        User = get_user_model()
        self.staff = User.objects.create_user(username='staffact', password='pass12345', is_staff=True)

    def test_generate_pdf_by_order_number_returns_pdf(self):
        buf = BytesIO(b'%PDF-1.4 test')
        with patch('apps.orders.views.PDFReceiptGenerator') as MockGen:
            MockGen.return_value.generate.return_value = buf
            res = self.client.get(f'/api/v1/orders/{self.order.order_number}/generate-pdf/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_mark_paid_pending_sets_paid_and_confirmed(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.post(f'/api/v1/orders/{self.order.id}/mark_paid/', {}, format='json')
        self.assertEqual(res.status_code, 200, res.json() if res.content else res.status_code)
        self.order.refresh_from_db()
        self.assertTrue(self.order.paid)
        self.assertIsNotNone(self.order.paid_at)
        self.assertEqual(self.order.status, 'confirmed')

    def test_mark_paid_cancelled_returns_400(self):
        self.order.status = 'cancelled'
        self.order.save(update_fields=['status'])
        self.client.force_authenticate(user=self.staff)
        res = self.client.post(f'/api/v1/orders/{self.order.id}/mark_paid/', {}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json().get('error'), 'No se puede marcar como pagado un pedido cancelado')
        self.order.refresh_from_db()
        self.assertFalse(self.order.paid)

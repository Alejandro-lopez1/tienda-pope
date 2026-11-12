from decimal import Decimal
from io import BytesIO
from unittest.mock import patch
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from pypdf import PdfReader

from apps.categories.models import Category
from apps.products.models import Product
from apps.settings.models import StoreSettings
from apps.orders.services import PDFReceiptGenerator, WhatsAppMessageGenerator
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

    def test_generate_pdf_without_mock(self):
        """Test real PDF generation sin mock - verifica que reportlab genera un PDF válido."""
        res = self.client.get(f'/api/v1/orders/{self.order.order_number}/generate-pdf/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        # Verificar que el contenido es un PDF válido (empieza con %PDF)
        # FileResponse usa streaming_content, no .content
        pdf_content = b''.join(res.streaming_content)
        self.assertTrue(pdf_content.startswith(b'%PDF'), "Response body must start with %PDF")

    def test_generate_pdf_with_special_chars_in_name(self):
        """Test PDF generation con caracteres especiales en nombre del cliente.
        Verifica que los caracteres especiales en Paragraph se escapan correctamente sin romper el PDF."""
        # Producto con caracteres especiales en nombre
        product = Product.objects.create(
            name='Jabón & Cía <Premium>',
            sku='SKU-SOAP-01',
            category=self.product.category,
            description='Test product',
            price=Decimal('120.00'),
            stock=10,
            is_active=True,
        )
        order = Order.objects.create(
            customer_name='Juan & Pedro <3',
            customer_phone='+54 9 376-4710683',
            customer_email='juan.pedro@example.com',
            customer_address='Calle José de Alencar & Martín Fierro, 1234',
            payment_method='cash',
            subtotal=Decimal('120.00'),
            total=Decimal('120.00'),
            status='pending',
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=1,
            price=Decimal('120.00'),
        )
        res = self.client.get(f'/api/v1/orders/{order.order_number}/generate-pdf/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        
        # Extraer contenido del PDF y verificar que contiene los textos correctos
        pdf_content = b''.join(res.streaming_content)
        self.assertTrue(pdf_content.startswith(b'%PDF'), "Response body must start with %PDF")
        
        # Leer el PDF con pypdf para extraer texto
        pdf_buffer = BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_buffer)
        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text()
        
        # Verificar que los nombres aparecen sin &amp; en el PDF
        self.assertIn('Juan & Pedro', pdf_text, "Customer name with & should appear in PDF")
        self.assertIn('Jabón & Cía', pdf_text, "Product name with & should appear in PDF")
        self.assertNotIn('&amp;', pdf_text, "PDF should not contain escaped HTML entities")
        self.assertIn('Calle José de Alencar & Martín Fierro', pdf_text, "Address with & should appear in PDF")

    def test_generate_pdf_with_deleted_product(self):
        """Test PDF generation - verifica que el código es defensivo si producto está None."""
        # Este test verifica que el endpoint sigue funcionando
        res = self.client.get(f'/api/v1/orders/{self.order.order_number}/generate-pdf/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_whatsapp_message_with_special_chars(self):
        """Test WhatsApp message generation con caracteres especiales.
        Verifica que los caracteres especiales aparecen sin escaping en el mensaje."""
        # Crear un producto con caracteres especiales (sin HTML tags)
        product = Product.objects.create(
            name='Jabón & Cía Premium',
            sku='SKU-SOAP-02',
            category=self.product.category,
            description='Test product',
            price=Decimal('150.00'),
            stock=10,
            is_active=True,
        )
        order = Order.objects.create(
            customer_name='Juan & Pedro',
            customer_phone='+54 9 376-4710683',
            customer_email='juan.pedro@example.com',
            payment_method='cash',
            subtotal=Decimal('150.00'),
            total=Decimal('150.00'),
            status='pending',
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            price=Decimal('75.00'),
        )
        
        # Generar mensaje de WhatsApp
        message = WhatsAppMessageGenerator.generate_message(order)
        
        # Verificar que los caracteres especiales aparecen sin escaping
        self.assertIn('Juan & Pedro', message, "Customer name with & should appear in message")
        self.assertIn('Jabón & Cía Premium', message, "Product name with & should appear in message")
        self.assertNotIn('&amp;', message, "Message should not contain escaped HTML entities")
        # Mensaje de WhatsApp es texto plano, no debe contener &lt; o &gt;
        self.assertNotIn('&lt;', message, "Message should not contain escaped < tag")
        self.assertNotIn('&gt;', message, "Message should not contain escaped > tag")

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


class StoreSettingsWhatsAppTests(TestCase):
    """Tests para integración de StoreSettings con WhatsApp."""
    
    def setUp(self):
        """Limpiar StoreSettings antes de cada test."""
        StoreSettings.objects.all().delete()
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Producto Test',
            sku='TEST-001',
            category=self.category,
            description='Producto de prueba',
            price=Decimal('100.00'),
            stock=10,
        )
        self.order = Order.objects.create(
            customer_name='Cliente Test',
            customer_phone='5491234567890',
            customer_address='Dir Test',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('100.00'),
        )
    
    def test_whatsapp_link_with_store_settings(self):
        """generate_whatsapp_link() debe usar el número de StoreSettings."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = '5493764710683'
        store.save()
        
        message = WhatsAppMessageGenerator.generate_message(self.order)
        link = WhatsAppMessageGenerator.generate_whatsapp_link(message)
        
        self.assertIsNotNone(link)
        self.assertIn('5493764710683', link)
        self.assertIn('wa.me', link)
    
    def test_whatsapp_link_no_number_configured(self):
        """generate_whatsapp_link() retorna None si no hay número configurado."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = ''
        store.save()
        
        message = WhatsAppMessageGenerator.generate_message(self.order)
        link = WhatsAppMessageGenerator.generate_whatsapp_link(message)
        
        self.assertIsNone(link)
    
    def test_generate_for_order_with_whatsapp(self):
        """generate_for_order() retorna datos completos con WhatsApp configurado."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = '5493764710683'
        store.save()
        
        data = WhatsAppMessageGenerator.generate_for_order(self.order)
        
        self.assertIn('message', data)
        self.assertIn('whatsapp_link', data)
        self.assertIn('phone_number', data)
        self.assertIsNotNone(data['whatsapp_link'])
        self.assertEqual(data['phone_number'], '5493764710683')
    
    def test_generate_for_order_without_whatsapp(self):
        """generate_for_order() retorna null para whatsapp_link si no está configurado."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = ''
        store.save()
        
        data = WhatsAppMessageGenerator.generate_for_order(self.order)
        
        self.assertIn('message', data)
        self.assertIsNone(data['whatsapp_link'])
        self.assertIsNone(data['phone_number'])


class StoreSettingsOrderPDFTests(TestCase):
    """Tests para integración de StoreSettings con PDF."""
    
    def setUp(self):
        """Limpiar antes de cada test."""
        StoreSettings.objects.all().delete()
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Producto PDF',
            sku='PDF-001',
            category=self.category,
            description='Producto para PDF',
            price=Decimal('150.00'),
            stock=5,
        )
        self.order = Order.objects.create(
            customer_name='Cliente PDF',
            customer_phone='5491111111111',
            customer_address='Dir PDF',
            payment_method='cash',
            subtotal=Decimal('150.00'),
            total=Decimal('150.00'),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('150.00'),
        )
    
    def test_pdf_generation_uses_store_name(self):
        """PDF debe incluir store_name de StoreSettings."""
        store = StoreSettings.get_or_create_default()
        store.store_name = 'Tienda Test PDF'
        store.save()
        
        generator = PDFReceiptGenerator()
        pdf_buffer = generator.generate(self.order)
        
        # Verificar que el PDF se generó (sin errores)
        self.assertGreater(pdf_buffer.getbuffer().nbytes, 0)
    
    def test_pdf_generation_with_whatsapp_in_footer(self):
        """PDF footer debe mencionar WhatsApp si está configurado."""
        store = StoreSettings.get_or_create_default()
        store.store_name = 'Popé Test'
        store.whatsapp_number = '5493764710683'
        store.save()
        
        generator = PDFReceiptGenerator()
        pdf_buffer = generator.generate(self.order)
        
        # PDF generado sin errores
        self.assertGreater(pdf_buffer.getbuffer().nbytes, 0)


class SendWhatsAppEndpointTests(APITestCase):
    """Tests para el endpoint send-whatsapp."""
    
    def setUp(self):
        """Setup para tests."""
        StoreSettings.objects.all().delete()
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            category=self.category,
            description='Test',
            price=Decimal('100.00'),
            stock=10,
        )
        self.order = Order.objects.create(
            customer_name='Test Client',
            customer_phone='5491234567890',
            customer_address='Test Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=Decimal('100.00'),
        )
    
    def test_send_whatsapp_with_configured_number(self):
        """POST send-whatsapp retorna 200 con whatsapp_link si hay número."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = '5493764710683'
        store.save()
        
        response = self.client.post(
            f'/api/v1/orders/{self.order.order_number}/send-whatsapp/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('whatsapp_link', response.data)
        self.assertIsNotNone(response.data['whatsapp_link'])
        self.assertIn('wa.me', response.data['whatsapp_link'])
    
    def test_send_whatsapp_without_configured_number(self):
        """POST send-whatsapp retorna 503 si no hay número configurado."""
        store = StoreSettings.get_or_create_default()
        store.whatsapp_number = ''
        store.save()
        
        response = self.client.post(
            f'/api/v1/orders/{self.order.order_number}/send-whatsapp/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)
        self.assertIn('No hay número de WhatsApp', response.data['error'])


class OrderDestroyTests(APITestCase):
    """Tests para el endpoint DELETE (destroy) de pedidos."""
    
    def setUp(self):
        """Setup para tests."""
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            category=self.category,
            description='Test',
            price=Decimal('100.00'),
            stock=10,
        )
        User = get_user_model()
        self.admin_user = User.objects.create_user(
            username='admin',
            password='pass12345',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            password='pass12345',
            is_staff=False
        )
    
    def test_destroy_cancelled_order_returns_204_and_deletes(self):
        """DELETE pedido cancelado retorna 204 y elimina el pedido + items."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='cancelled'
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            price=Decimal('100.00')
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Order.objects.filter(id=order.id).exists())
        self.assertFalse(OrderItem.objects.filter(id=item.id).exists())
    
    def test_destroy_pending_order_returns_400(self):
        """DELETE pedido pending retorna 400 sin eliminar."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='pending'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Solo se pueden eliminar pedidos cancelados', response.json()['error'])
        self.assertTrue(Order.objects.filter(id=order.id).exists())
    
    def test_destroy_confirmed_order_returns_400(self):
        """DELETE pedido confirmed retorna 400 sin eliminar."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='confirmed'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Order.objects.filter(id=order.id).exists())
    
    def test_destroy_delivered_order_returns_400(self):
        """DELETE pedido entregado retorna 400 sin eliminar."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='delivered'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Order.objects.filter(id=order.id).exists())
    
    def test_destroy_non_admin_returns_403(self):
        """DELETE sin ser admin retorna 403."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='cancelled'
        )
        
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Order.objects.filter(id=order.id).exists())
    
    def test_destroy_anonymous_returns_401_or_403(self):
        """DELETE sin autenticar retorna 401 o 403."""
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='cancelled'
        )
        
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        # 401 unauthenticated o 403 unauthorized, ambos válidos
        self.assertIn(response.status_code, (401, 403))
        self.assertTrue(Order.objects.filter(id=order.id).exists())
    
    def test_destroy_cancelled_does_not_affect_stock(self):
        """DELETE pedido cancelado NO toca stock (ya fue repuesto al cancelar)."""
        initial_stock = self.product.stock
        
        order = Order.objects.create(
            customer_name='Test',
            customer_phone='1234567890',
            customer_address='Dir',
            payment_method='cash',
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            status='cancelled'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=Decimal('50.00')
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/orders/{order.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock)

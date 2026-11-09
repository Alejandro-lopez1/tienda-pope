from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from io import BytesIO

from PIL import Image
from rest_framework.test import APITestCase

from apps.categories.models import Category
from .models import Product


class ProductModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Limpiadores',
            description='Productos de limpieza'
        )
        
        # Crear imagen de prueba
        img = Image.new('RGB', (100, 100), color='red')
        img_io = BytesIO()
        img.save(img_io, format='JPEG')
        img_io.seek(0)
        
        self.product = Product.objects.create(
            name='Limpiador Multiusos',
            sku='LIMP-001',
            category=self.category,
            description='Limpiador versátil',
            price=250.00,
            image=SimpleUploadedFile(
                'test.jpg',
                img_io.getvalue(),
                content_type='image/jpeg'
            ),
            stock=100
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, 'Limpiador Multiusos')
        self.assertEqual(self.product.slug, 'limpiador-multiusos')
        self.assertEqual(self.product.price, 250.00)
        self.assertTrue(self.product.in_stock)

    def test_discount_calculation(self):
        self.product.discount_percentage = 10
        self.assertEqual(self.product.discounted_price, 225.00)

    def test_product_string_representation(self):
        self.assertEqual(str(self.product), 'Limpiador Multiusos')


class ProductAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='SinImagenCat')
        User = get_user_model()
        self.staff = User.objects.create_user(username='staffp', password='pass12345', is_staff=True)

    def test_staff_can_create_product_without_image(self):
        self.client.force_authenticate(user=self.staff)
        payload = {
            'name': 'Producto sin imagen',
            'sku': 'NOIMG-001',
            'category': self.category.id,
            'description': 'Creado sin imagen',
            'price': '199.99',
            'stock': 3,
        }
        res = self.client.post('/api/v1/products/', payload, format='json')
        self.assertEqual(res.status_code, 201, res.json() if res.content else res.status_code)
        product = Product.objects.get(sku='NOIMG-001')
        self.assertFalse(product.image)

    def test_list_products_returns_price_and_rating_as_numbers(self):
        Product.objects.create(
            name='Decimal Check',
            sku='DEC-001',
            category=self.category,
            description='Tipos numéricos',
            price='123.45',
            stock=2,
            rating='4.50',
            is_active=True,
        )
        res = self.client.get('/api/v1/products/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        results = data.get('results', data)
        self.assertTrue(results, 'Se esperaba al menos un producto en la lista')
        item = results[0]
        self.assertIsInstance(item['price'], (int, float), item['price'])
        self.assertNotIsInstance(item['price'], bool)
        self.assertIsInstance(item['rating'], (int, float), item['rating'])
        self.assertNotIsInstance(item['rating'], bool)

from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APITestCase

from apps.categories.models import Category
from .models import Product


def make_image_file(name='test.jpg', size=(100, 100), color='red'):
    img = Image.new('RGB', size, color=color)
    buf = BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')


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

    def test_two_products_same_name_get_distinct_slugs(self):
        p1 = Product.objects.create(
            name='Mismo Nombre', sku='SAME-001', category=self.category,
            description='Uno', price=100, stock=1,
        )
        p2 = Product.objects.create(
            name='Mismo Nombre', sku='SAME-002', category=self.category,
            description='Dos', price=100, stock=1,
        )
        self.assertEqual(p1.slug, 'mismo-nombre')
        self.assertEqual(p2.slug, 'mismo-nombre-2')
        self.assertNotEqual(p1.slug, p2.slug)

    def test_new_image_generates_thumbnail(self):
        self.assertTrue(self.product.image)
        self.assertTrue(self.product.image_thumbnail)

    def test_large_image_is_resized_to_max_1200(self):
        p = Product.objects.create(
            name='Grande',
            sku='BIG-001',
            category=self.category,
            description='Imagen grande',
            price=100,
            stock=1,
            image=make_image_file('big.jpg', size=(3000, 2000)),
        )
        p.image.open('rb')
        with Image.open(p.image) as img:
            self.assertLessEqual(max(img.size), 1200)


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

    def _make_product(self, **kwargs):
        defaults = dict(
            name='Detalle', sku='DET-001', category=self.category,
            description='Desc', price='50.00', stock=5, is_active=True,
        )
        defaults.update(kwargs)
        return Product.objects.create(**defaults)

    def test_get_product_by_slug_returns_200(self):
        p = self._make_product(name='Por Slug', sku='SLUG-001')
        res = self.client.get(f'/api/v1/products/{p.slug}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['id'], p.id)

    def test_get_product_by_id_returns_200(self):
        p = self._make_product(name='Por Id', sku='ID-001')
        res = self.client.get(f'/api/v1/products/{p.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['slug'], p.slug)

    def test_get_nonexistent_slug_returns_404(self):
        res = self.client.get('/api/v1/products/no-existe-este-slug/')
        self.assertEqual(res.status_code, 404)

    def test_get_inactive_product_by_slug_as_anonymous_returns_404(self):
        p = self._make_product(name='Inactivo', sku='INACT-001', is_active=False)
        self.client.logout()
        res = self.client.get(f'/api/v1/products/{p.slug}/')
        self.assertEqual(res.status_code, 404)

    def test_patch_stock_and_is_active_does_not_reupload_image(self):
        self.client.force_authenticate(user=self.staff)
        p = Product.objects.create(
            name='Con Imagen',
            sku='IMG-001',
            category=self.category,
            description='Tiene imagen',
            price=100,
            stock=5,
            is_active=True,
            image=make_image_file('keep.jpg', size=(200, 200)),
        )
        with patch.object(default_storage, 'save', wraps=default_storage.save) as mock_save:
            res = self.client.patch(
                f'/api/v1/products/{p.id}/',
                {'stock': 9, 'is_active': False},
                format='json',
            )
        self.assertEqual(res.status_code, 200, res.json() if res.content else res.status_code)
        mock_save.assert_not_called()
        p.refresh_from_db()
        self.assertEqual(p.stock, 9)
        self.assertFalse(p.is_active)

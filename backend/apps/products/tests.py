from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from io import BytesIO

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

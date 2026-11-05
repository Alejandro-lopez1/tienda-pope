from django.test import TestCase
from .models import Category


class CategoryModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Desinfectantes',
            description='Productos para desinfectar',
            order=1
        )

    def test_category_creation(self):
        self.assertEqual(self.category.name, 'Desinfectantes')
        self.assertEqual(self.category.slug, 'desinfectantes')
        self.assertTrue(self.category.is_active)

    def test_category_string_representation(self):
        self.assertEqual(str(self.category), 'Desinfectantes')

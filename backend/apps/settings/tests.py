from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import StoreSettings

User = get_user_model()


class StoreSettingsModelTests(TestCase):
    """Tests para el modelo StoreSettings."""
    
    def setUp(self):
        """Limpiar antes de cada test."""
        StoreSettings.objects.all().delete()
    
    def test_singleton_get_or_create_default(self):
        """StoreSettings.get_or_create_default() crea una sola fila."""
        obj1 = StoreSettings.get_or_create_default()
        obj2 = StoreSettings.get_or_create_default()
        
        self.assertEqual(obj1.pk, obj2.pk)
        self.assertEqual(StoreSettings.objects.count(), 1)
    
    def test_whatsapp_number_validation_valid(self):
        """Número de WhatsApp válido (10+ dígitos)."""
        obj = StoreSettings.objects.create(
            store_name='Test',
            whatsapp_number='5493764710683'
        )
        self.assertEqual(obj.whatsapp_number, '5493764710683')
    
    def test_whatsapp_number_validation_invalid_format(self):
        """Número de WhatsApp con caracteres no-dígitos debe fallar."""
        with self.assertRaises(Exception):
            StoreSettings.objects.create(
                store_name='Test',
                whatsapp_number='+54 9 3764 71-0683'  # No solo dígitos
            )
    
    def test_whatsapp_number_validation_too_short(self):
        """Número de WhatsApp < 10 dígitos debe fallar."""
        with self.assertRaises(Exception):
            StoreSettings.objects.create(
                store_name='Test',
                whatsapp_number='12345'
            )
    
    def test_whatsapp_number_optional(self):
        """Número de WhatsApp puede estar vacío (blank=True)."""
        obj = StoreSettings.objects.create(
            store_name='Test',
            whatsapp_number=''
        )
        self.assertEqual(obj.whatsapp_number, '')
    
    def test_get_public_fields(self):
        """get_public_fields() retorna solo campos públicos."""
        obj = StoreSettings.objects.create(
            store_name='Popé',
            email='info@pope.com',
            phone='+54 9 3764',
            whatsapp_number='5493764710683',
            address='Av. Principal 123',
            delivery_zones='Zona 1, Zona 2'
        )
        
        public = obj.get_public_fields()
        self.assertEqual(public['store_name'], 'Popé')
        self.assertEqual(public['email'], 'info@pope.com')
        self.assertIn('store_name', public)
        self.assertNotIn('created_at', public)


class StoreSettingsAPITests(TestCase):
    """Tests para los endpoints de API."""
    
    def setUp(self):
        """Setup para cada test."""
        StoreSettings.objects.all().delete()
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
    
    def test_list_public_anonymous(self):
        """GET /api/v1/store-settings/ anónimo retorna campos públicos."""
        obj = StoreSettings.get_or_create_default()
        obj.store_name = 'Popé'
        obj.email = 'info@pope.com'
        obj.whatsapp_number = '5493764710683'
        obj.address = 'Av. Principal'
        obj.save()
        
        response = self.client.get('/api/v1/store-settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Debe incluir campos públicos
        self.assertIn('store_name', response.data)
        self.assertIn('email', response.data)
        self.assertIn('whatsapp_number', response.data)
        self.assertIn('address', response.data)
        self.assertIn('delivery_zones', response.data)
    
    def test_list_admin_sees_all_fields(self):
        """GET /api/v1/store-settings/ admin retorna todos los campos."""
        obj = StoreSettings.get_or_create_default()
        obj.store_name = 'Popé'
        obj.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/store-settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin ve created_at, updated_at
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)
    
    def test_patch_anonymous_forbidden(self):
        """PATCH anónimo debe ser denegado."""
        obj = StoreSettings.get_or_create_default()
        
        response = self.client.patch(
            '/api/v1/store-settings/1/',
            {'store_name': 'Nuevo Nombre'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verificar que no cambió
        obj.refresh_from_db()
        self.assertNotEqual(obj.store_name, 'Nuevo Nombre')
    
    def test_patch_regular_user_forbidden(self):
        """PATCH de usuario regular debe ser denegado."""
        obj = StoreSettings.get_or_create_default()
        
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            '/api/v1/store-settings/1/',
            {'store_name': 'Nuevo Nombre'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_patch_admin_allowed(self):
        """PATCH de admin actualiza la configuración."""
        obj = StoreSettings.get_or_create_default()
        obj.store_name = 'Original'
        obj.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            '/api/v1/store-settings/1/',
            {
                'store_name': 'Popé Actualizado',
                'whatsapp_number': '5493764710683'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que cambió
        obj.refresh_from_db()
        self.assertEqual(obj.store_name, 'Popé Actualizado')
        self.assertEqual(obj.whatsapp_number, '5493764710683')
    
    def test_patch_invalid_whatsapp_number(self):
        """PATCH con número de WhatsApp inválido debe fallar."""
        obj = StoreSettings.get_or_create_default()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            '/api/v1/store-settings/1/',
            {'whatsapp_number': '+54 9 invalid'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_put_admin_replaces_all_fields(self):
        """PUT de admin reemplaza todos los campos."""
        obj = StoreSettings.get_or_create_default()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(
            '/api/v1/store-settings/1/',
            {
                'store_name': 'Nueva Tienda',
                'email': 'new@email.com',
                'phone': '+54 9 1234',
                'whatsapp_number': '5491234567890',
                'address': 'Nueva Dir 456',
                'delivery_zones': 'Zona 1'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        obj.refresh_from_db()
        self.assertEqual(obj.store_name, 'Nueva Tienda')
        self.assertEqual(obj.email, 'new@email.com')

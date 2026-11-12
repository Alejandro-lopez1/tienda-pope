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
        """Número de WhatsApp con caracteres no-dígitos debe fallar en full_clean()."""
        from django.core.exceptions import ValidationError
        obj = StoreSettings(
            store_name='Test',
            whatsapp_number='+54 9 3764'  # No solo dígitos
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()
    
    def test_whatsapp_number_validation_too_short(self):
        """Número de WhatsApp < 10 dígitos debe fallar en full_clean()."""
        from django.core.exceptions import ValidationError
        obj = StoreSettings(
            store_name='Test',
            whatsapp_number='12345'  # < 10 dígitos
        )
        with self.assertRaises(ValidationError):
            obj.full_clean()
    
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
        User = get_user_model()
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
        self.client = APIClient()
    
    def test_patch_admin_allowed(self):
        """PATCH de admin actualiza la configuración."""
        # Crear la configuración
        obj = StoreSettings.get_or_create_default()
        obj.store_name = 'Original'
        obj.save()
        
        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)
        
        # PATCH request
        response = self.client.patch('/api/v1/store-settings/1/', {
            'store_name': 'Actualizado',
            'whatsapp_number': '5493764710683'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        obj.refresh_from_db()
        self.assertEqual(obj.store_name, 'Actualizado')
        self.assertEqual(obj.whatsapp_number, '5493764710683')
    
    def test_patch_invalid_whatsapp_number(self):
        """PATCH con número de WhatsApp inválido debe fallar."""
        obj = StoreSettings.get_or_create_default()
        
        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)
        
        # PATCH request con WhatsApp inválido
        response = self.client.patch('/api/v1/store-settings/1/', {
            'whatsapp_number': '+54 9 invalid'  # Inválido
        }, format='json')
        
        # Debe retornar error 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

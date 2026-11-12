# Generated migration for StoreSettings model

from django.db import migrations, models
import apps.settings.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='StoreSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('store_name', models.CharField(default='Popé', help_text='Nombre de la tienda (mostrado en catálogo, recibos, etc.)', max_length=150)),
                ('email', models.EmailField(blank=True, help_text='Email de contacto (opcional, mostrado en pie de página)', max_length=254, null=True)),
                ('phone', models.CharField(blank=True, default='', help_text='Teléfono de contacto (formato: + y dígitos, ej: +54 9 3764 71-0683)', max_length=20)),
                ('whatsapp_number', models.CharField(blank=True, default='', help_text='Número de WhatsApp en formato internacional sin +: ej 5493764710683', max_length=20, validators=[apps.settings.models.validate_whatsapp_number])),
                ('address', models.TextField(blank=True, default='', help_text='Dirección de la tienda (mostrada en pie de página)')),
                ('delivery_zones', models.TextField(blank=True, default='', help_text='Información sobre zonas de entrega (mostrada en carrito/checkout)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuración de la Tienda',
                'verbose_name_plural': 'Configuración de la Tienda',
            },
        ),
    ]

# Data migration to create default StoreSettings row

from django.db import migrations


def create_default_settings(apps, schema_editor):
    """Crear la fila de configuración por defecto."""
    StoreSettings = apps.get_model('settings', 'StoreSettings')
    if not StoreSettings.objects.exists():
        StoreSettings.objects.create(
            pk=1,
            store_name='Popé',
            email='',
            phone='',
            whatsapp_number='',
            address='',
            delivery_zones='',
        )


def reverse_func(apps, schema_editor):
    """No hacer nada en reverse para evitar eliminar datos."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_settings, reverse_func),
    ]

import getpass
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.auth.models import AdminUser

User = get_user_model()
MIN_PASSWORD_LENGTH = 12


class Command(BaseCommand):
    help = 'Crear un usuario administrador con perfil AdminUser. La contraseña se solicita de forma segura (nunca en argumentos).'
    
    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Email del administrador')
        parser.add_argument('--first-name', type=str, required=True, help='Nombre del administrador')
    
    def handle(self, *args, **options):
        email = options.get('email', '').strip()
        first_name = options.get('first_name', '').strip()
        
        # Validar argumentos
        if not email:
            raise CommandError('❌ El email es requerido.')
        if not first_name:
            raise CommandError('❌ El nombre es requerido.')
        
        # Verificar que no exista usuario con ese email
        if User.objects.filter(email=email).exists():
            raise CommandError(f'❌ Ya existe un usuario con el email {email}.')
        
        # Solicitar contraseña de forma segura
        self.stdout.write(
            self.style.WARNING(
                f'\n🔐 Contraseña (mínimo {MIN_PASSWORD_LENGTH} caracteres):\n'
                '   (no se mostrará mientras escribes)'
            )
        )
        
        password = getpass.getpass('   Contraseña: ')
        password_confirm = getpass.getpass('   Confirmar: ')
        
        # Validar contraseña
        if not password:
            raise CommandError('❌ La contraseña no puede estar vacía.')
        if len(password) < MIN_PASSWORD_LENGTH:
            raise CommandError(
                f'❌ La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres. '
                f'Ingresaste {len(password)}.'
            )
        if password != password_confirm:
            raise CommandError('❌ Las contraseñas no coinciden.')
        
        try:
            # Crear usuario
            user = User.objects.create_user(
                username=email,  # Usar email como username
                email=email,
                first_name=first_name,
                password=password,
                is_staff=True,  # Permitir acceso al admin
                is_active=True,
            )
            
            # Crear perfil AdminUser
            admin_user = AdminUser.objects.create(
                user=user,
                role='admin',  # Rol admin
                is_active=True,
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Administrador creado exitosamente:\n'
                    f'   Email: {email}\n'
                    f'   Nombre: {first_name}\n'
                    f'   Usuario ID: {user.id}\n'
                    f'   AdminUser ID: {admin_user.id}\n'
                )
            )
        except Exception as e:
            raise CommandError(f'❌ Error al crear administrador: {str(e)}')

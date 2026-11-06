# ✓ Validación Pre-Deployment

Este documento proporciona pasos de validación para asegurar que la configuración de producción es correcta.

---

## 1️⃣ Validaciones Offline (sin entorno Django)

### 1.1 Validar Sintaxis de Python

```powershell
# En Windows PowerShell desde la raíz del proyecto
python -m py_compile backend/config/settings.py
python -m py_compile backend/config/urls.py
python -m py_compile backend/gunicorn_config.py

echo "✓ Sintaxis válida"
```

**Esperado:** Ningún error  
**Si falla:** Revisar sintaxis de Python en los archivos

---

### 1.2 Validar requirements.txt

```powershell
# Verificar que todas las dependencias están listadas
Select-String -Path backend/requirements.txt "dj-database-url|django-storages|boto3|whitenoise|gunicorn"

echo "✓ Dependencias críticas presentes"
```

**Esperado:** 5 líneas (una por cada dependencia)

---

### 1.3 Validar .env.example

```powershell
# Verificar variables críticas en .env.example
Select-String -Path .env.example "^SECRET_KEY|^DATABASE_URL|^SECURE_SSL_REDIRECT|^USE_R2_STORAGE|^R2_"

echo "✓ Variables de entorno documentadas"
```

**Esperado:** Al menos 9 líneas encontradas

---

### 1.4 Validar Archivos Nuevos Existen

```powershell
$archivos = @(
    "backend/gunicorn_config.py",
    "Procfile",
    "docs/IMPLEMENTACION_PRE_DEPLOY.md",
    "docs/VALIDACION_PRE_DEPLOY.md"
)

foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "✓ $archivo"
    } else {
        Write-Host "✗ $archivo FALTANTE"
    }
}
```

**Esperado:** Todos presentes

---

## 2️⃣ Validaciones con Django (requieren entorno configurado)

### Prerequisito

```powershell
cd backend

# Instalar dependencias (incluyendo las nuevas)
pip install -r requirements.txt

# Asegurarse de que .env esté configurado con valores mínimos
# (usar .env.example como plantilla)
```

---

### 2.1 Check Básico de Django

```powershell
# Desde backend/
python manage.py check

echo "Esperado: System check identified no issues (0 silenced)."
```

**Si falla:** Revisar errores específicos

---

### 2.2 Check de Deployment

```powershell
# Desde backend/
python manage.py check --deploy

echo "Esperado: System check identified no issues (X silenced)."
```

**Advertencias Esperadas:**
- CSRF cookies no seguros en desarrollo (OK, solo en DEBUG=False en prod)
- Session cookies no seguros en desarrollo (OK)

**Si hay otros errores:** Revisar antes de deploy

---

### 2.3 Validar Migraciones

```powershell
# Desde backend/
# Ver plan de migraciones sin aplicarlas
python manage.py migrate --plan

# Esperado: Lista de migraciones con ✓ (ya aplicadas) o sin marca (por aplicar)
```

---

### 2.4 Recolectar Static Files

```powershell
# Desde backend/
python manage.py collectstatic --noinput --clear

echo "Esperado: ... static files collected in X.Xs"
```

**Resultado:** Se crean archivos en `backend/staticfiles/`

---

### 2.5 Validar Importación de Módulos

```powershell
# Desde backend/
python -c "import dj_database_url; print('✓ dj-database-url');"
python -c "import storages; print('✓ django-storages');"
python -c "import boto3; print('✓ boto3');"
python -c "import whitenoise; print('✓ whitenoise');"

echo "✓ Todas las dependencias importables"
```

**Esperado:** Sin errores de importación

---

## 3️⃣ Validaciones de Configuración

### 3.1 Validar DATABASE_URL

```powershell
# Desde backend/, con DATABASE_URL configurada en .env
$env:DATABASE_URL = "postgresql://user:pass@neon.tech:5432/db?sslmode=require"

python -c "
import dj_database_url
import os

url = os.environ.get('DATABASE_URL')
db_config = dj_database_url.config(default=url)
print(f\"✓ Database: {db_config['NAME']} on {db_config['HOST']}\")
print(f\"✓ Engine: {db_config['ENGINE']}\")
"
```

---

### 3.2 Validar Configuración de Almacenamiento

```powershell
# Desde backend/
python -c "
from django.conf import settings

print('=== Static Files ===')
print(f'STATIC_URL: {settings.STATIC_URL}')
print(f'STATIC_ROOT: {settings.STATIC_ROOT}')
print(f'STATICFILES_STORAGE: {settings.STATICFILES_STORAGE}')

print('\n=== Media Files ===')
print(f'MEDIA_URL: {settings.MEDIA_URL}')
print(f'MEDIA_ROOT: {settings.MEDIA_ROOT}')
print(f'DEFAULT_FILE_STORAGE: {getattr(settings, \"DEFAULT_FILE_STORAGE\", \"LocalStorage\")}')
"
```

---

### 3.3 Validar Seguridad

```powershell
# Desde backend/ con DEBUG=False en .env
$env:DEBUG = "False"

python -c "
from django.conf import settings

print('=== Security Settings ===')
print(f'DEBUG: {settings.DEBUG}')
print(f'SECURE_SSL_REDIRECT: {getattr(settings, \"SECURE_SSL_REDIRECT\", \"N/A\")}')
print(f'SESSION_COOKIE_SECURE: {getattr(settings, \"SESSION_COOKIE_SECURE\", \"N/A\")}')
print(f'CSRF_COOKIE_SECURE: {getattr(settings, \"CSRF_COOKIE_SECURE\", \"N/A\")}')
print(f'SECURE_HSTS_SECONDS: {getattr(settings, \"SECURE_HSTS_SECONDS\", \"N/A\")}')
print(f'SECURE_PROXY_SSL_HEADER: {getattr(settings, \"SECURE_PROXY_SSL_HEADER\", \"N/A\")}')
"
```

---

### 3.4 Validar CORS y CSRF

```powershell
# Desde backend/
python -c "
from django.conf import settings

print('=== CORS & CSRF ===')
print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
print(f'CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}')
print(f'CSRF_TRUSTED_ORIGINS: {settings.CSRF_TRUSTED_ORIGINS}')
"
```

---

## 4️⃣ Validación de Health Check

### 4.1 Iniciar servidor de desarrollo

```powershell
# Desde backend/ (solo para testing, no para producción)
python manage.py runserver 0.0.0.0:8000
```

Luego, en otra terminal:

```powershell
curl http://localhost:8000/health/

# Esperado: JSON con status "healthy"
```

---

## 5️⃣ Validación en Render (simulación local)

### 5.1 Simular comando de Render

```powershell
# Desde la raíz del proyecto
# (Render ejecuta: cd backend && python manage.py migrate && gunicorn -c gunicorn_config.py config.wsgi)

cd backend
python manage.py migrate --noinput
python -m gunicorn -c gunicorn_config.py config.wsgi --bind 0.0.0.0:8000 --workers 2
```

---

## 6️⃣ Checklist Final

Antes de hacer push a GitHub:

- [ ] ✓ Validación offline: sintaxis + dependencias
- [ ] ✓ Check básico: `python manage.py check`
- [ ] ✓ Check deployment: `python manage.py check --deploy`
- [ ] ✓ Migraciones válidas: `python manage.py migrate --plan`
- [ ] ✓ Static files: `python manage.py collectstatic`
- [ ] ✓ Importaciones: todas las dependencias nuevas funcionan
- [ ] ✓ .env.example tiene todas las variables críticas
- [ ] ✓ Procfile y gunicorn_config.py válidos
- [ ] ✓ Health check responde correctamente
- [ ] ✓ No hay cambios no realizados en archivos críticos

---

## 🔧 Troubleshooting

### Error: "No module named 'dj_database_url'"

```bash
pip install dj-database-url==2.1.0
```

---

### Error: "psycopg2 connection failed"

**Causa:** DATABASE_URL inválida o Neon no accesible

```bash
# Verificar formato: postgresql://user:pass@host:5432/db?sslmode=require
# Verificar que sslmode=require esté en la URL
```

---

### Error: "STATIC_ROOT is not an absolute path"

Ya está resuelto en settings.py usando `BASE_DIR / 'staticfiles'`

---

### Error: "SECRET_KEY environment variable must be set in production"

En Render, configurar en Environment Variables:
- Copiar output de: `django-insecure-...` de una generación anterior
- O usar: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

---

## 📞 Referencias

- [dj-database-url docs](https://github.com/jacobian/dj-database-url)
- [django-storages S3](https://django-storages.readthedocs.io/en/latest/backends/amazon_s3.html)
- [WhiteNoise documentation](https://whitenoise.readthedocs.io/)
- [Django deployment checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)

---

**Última actualización:** 2026-11-05

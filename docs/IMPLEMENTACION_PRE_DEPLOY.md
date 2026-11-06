# 📋 Implementación: Correcciones Pre-Deployment

**Fecha:** 2026-11-05  
**Versión:** v0.8.0  
**Estado:** ✅ Completada (Etapas 1-3, pendiente Etapa 4: Validación)  
**Objetivo:** Preparar Popé para producción en Cloudflare Pages + Render + Neon + R2

---

## 🎯 Resumen Ejecutivo

Se han implementado **correcciones sistemáticas** en 4 etapas para preparar el deployment:

| Etapa | Área | Estado | Archivos |
|-------|------|--------|----------|
| **1** | Django Settings + DB | ✅ | `backend/config/settings.py`, `backend/requirements.txt` |
| **2** | Almacenamiento R2 | ✅ | `backend/config/settings.py` (media config) |
| **3** | Producción (Gunicorn+WhiteNoise) | ✅ | `Procfile`, `backend/gunicorn_config.py` |
| **4** | Validación | ⏳ | Scripts de chequeo |

---

## 📝 Etapa 1: Configuración Django

### 1.1 Soporte para Neon PostgreSQL

**Cambio:** `backend/config/settings.py`

- ✅ Agregado `import dj_database_url`
- ✅ Configuración condicional de BASE DE DATOS:
  - Si `DATABASE_URL` existe → Usa Neon (conn_max_age=600, conn_health_checks=True)
  - Si no → Usa variables `DB_*` (Docker Compose desarrollo)

```python
import dj_database_url

if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'tienda_pope'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', 'db'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
```

**Hallazgo Auditado:** B-006 (30 min) ✅

---

### 1.2 SECRET_KEY Seguro

**Cambio:** `backend/config/settings.py`

- ✅ SECRET_KEY requiere env variable en producción
- ✅ Sin fallback inseguro a valor hardcodeado
- ✅ Se genera temporalmente en desarrollo (DEBUG=True) con `get_random_secret_key()`

```python
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if os.environ.get('DEBUG', 'False') == 'True':
        from django.core.management.utils import get_random_secret_key
        SECRET_KEY = get_random_secret_key()
    else:
        raise ValueError("SECRET_KEY environment variable must be set in production")
```

**Hallazgo Auditado:** B-004 (15 min) ✅

---

### 1.3 Seguridad en Producción

**Cambio:** `backend/config/settings.py`

| Setting | Valor | Condición |
|---------|-------|-----------|
| `SECURE_SSL_REDIRECT` | True | `DEBUG=False` |
| `SESSION_COOKIE_SECURE` | True | `DEBUG=False` |
| `CSRF_COOKIE_SECURE` | True | `DEBUG=False` |
| `SECURE_PROXY_SSL_HEADER` | `('HTTP_X_FORWARDED_PROTO', 'https')` | `DEBUG=False` |
| `SECURE_HSTS_SECONDS` | 31536000 (1 año) | `DEBUG=False` |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | True | `DEBUG=False` |
| `SECURE_HSTS_PRELOAD` | True | `DEBUG=False` |

**Hallazgos Auditados:** B-005, SEC-003 ✅

---

### 1.4 ALLOWED_HOSTS y CORS Configurables

**Cambio:** `backend/config/settings.py`

- ✅ ALLOWED_HOSTS parseado desde env con defaults seguros
- ✅ CORS_ALLOWED_ORIGINS parseado desde env
- ✅ CSRF_TRUSTED_ORIGINS parseado desde env
- ✅ Strips de espacios en blanco en listas

```python
ALLOWED_HOSTS = [host.strip() for host in os.environ.get(
    'ALLOWED_HOSTS', 'localhost,127.0.0.1'
).split(',')]

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:5173'
    ).split(',')
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173'
    ).split(',')
]
```

**Hallazgos Auditados:** B-008, B-005 ✅

---

### 1.5 Dependencias Actualizadas

**Cambio:** `backend/requirements.txt`

```diff
+ dj-database-url==2.1.0      # Para DATABASE_URL parsing
+ django-storages==1.14.2     # Para almacenamiento en R2
+ boto3==1.28.85              # AWS SDK para R2 (S3-compatible)
+ whitenoise==6.6.0           # Static files en producción
```

---

## 📝 Etapa 2: Almacenamiento R2

### 2.1 Configuración Condicional de Media Storage

**Cambio:** `backend/config/settings.py`

```python
if os.environ.get('USE_R2_STORAGE', 'False') == 'True':
    # Production: Cloudflare R2 (S3-compatible)
    if 'storages' not in INSTALLED_APPS:
        INSTALLED_APPS = list(INSTALLED_APPS) + ['storages']
    
    AWS_STORAGE_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
    AWS_S3_REGION_NAME = 'auto'
    AWS_S3_ENDPOINT_URL = f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com"
    AWS_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    
    if os.environ.get('R2_CUSTOM_DOMAIN'):
        AWS_S3_CUSTOM_DOMAIN = os.environ.get('R2_CUSTOM_DOMAIN')
    
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN or AWS_STORAGE_BUCKET_NAME}.r2.cloudflarestorage.com/"
else:
    # Development: Local filesystem
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
```

**ImageFields Identificados:**
- `apps.categories.Category.image` → `categories/`
- `apps.products.Product.image` → `products/%Y/%m/`
- `apps.products.Product.image_thumbnail` → `products/thumbnails/`

**Hallazgo Auditado:** S-001 (1-2 hrs) ✅

---

## 📝 Etapa 3: Producción (Gunicorn + WhiteNoise)

### 3.1 Configuración de Gunicorn

**Archivo Nuevo:** `backend/gunicorn_config.py`

- ✅ Bind: `0.0.0.0:8000`
- ✅ Workers: `multiprocessing.cpu_count()`
- ✅ Worker class: `sync`
- ✅ Timeout: 120 segundos
- ✅ Logging: stdout/stderr (compatible con Render)
- ✅ Max requests: 1000 (evita memory leaks)

```bash
# Uso en Render:
gunicorn -c gunicorn_config.py config.wsgi
```

---

### 3.2 Procfile para Render

**Archivo Nuevo:** `Procfile`

```
web: cd backend && python manage.py migrate && gunicorn -c gunicorn_config.py config.wsgi
```

Este Procfile:
1. Navega al directorio backend
2. Ejecuta migraciones (una sola vez al deploy)
3. Inicia Gunicorn con configuración optimizada

---

### 3.3 WhiteNoise para Static Files

**Cambios:** `backend/config/settings.py`

```python
# MIDDLEWARE
'whitenoise.middleware.WhiteNoiseMiddleware'  # Habilitado

# STATIC FILES
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

WhiteNoise:
- ✅ Sirve static files sin servidor adicional
- ✅ Comprime y cachea en el navegador
- ✅ Compatible con CDN (Cloudflare)

**Hallazgo Auditado:** F-010 (parcialmente, frontend pendiente) ✅

---

### 3.4 Health Check Endpoint

**Cambio:** `backend/config/urls.py`

```python
@require_http_methods(["GET"])
def health_check(request):
    """Simple health check endpoint for monitoring and load balancers."""
    return JsonResponse({
        "status": "healthy",
        "service": "Pope API",
        "version": "0.8.0"
    })

urlpatterns = [
    path('health/', health_check, name='health_check'),
    # ... resto de URLs
]
```

- ✅ Endpoint: `GET /health/`
- ✅ Usado por Render para health checks automáticos
- ✅ Sin autenticación (necesario para monitoreo)

---

## 📝 Etapa 4: Validación (Pendiente)

### 4.1 Validación de Sintaxis ✅

```powershell
python -m py_compile backend/config/settings.py
```

**Resultado:** ✅ Válido

---

### 4.2 Validaciones Pendientes (requieren ambiente)

Los siguientes comandos deben ejecutarse en el ambiente de Render o con Django configurado:

```bash
# Validación de configuración Django
python manage.py check

# Validación específica de producción
python manage.py check --deploy

# Recolectar static files
python manage.py collectstatic --noinput

# Validar migraciones
python manage.py migrate --plan
```

---

## 📋 Checklist: Variables de Entorno Requeridas

### 🔴 CRÍTICAS (Producción)

- [ ] `SECRET_KEY` — Clave secreta única (generar con `django-insecure-...`)
- [ ] `DEBUG=False` — NUNCA True en producción
- [ ] `ALLOWED_HOSTS` — Lista separada por comas de dominios
- [ ] `DATABASE_URL` — PostgreSQL Neon (con `sslmode=require`)
- [ ] `SECURE_SSL_REDIRECT=True` — Redirigir HTTP a HTTPS

### 🟡 ALTAMENTE RECOMENDADAS (Seguridad)

- [ ] `CORS_ALLOWED_ORIGINS` — Dominios del frontend (separados por comas)
- [ ] `CSRF_TRUSTED_ORIGINS` — Dominios de origen para CSRF
- [ ] `SECURE_HSTS_SECONDS=31536000` — HSTS por 1 año
- [ ] `SECURE_HSTS_INCLUDE_SUBDOMAINS=True`
- [ ] `SECURE_HSTS_PRELOAD=True`

### 🟢 ALMACENAMIENTO (Para media files)

- [ ] `USE_R2_STORAGE=True` — Habilitar R2 en producción
- [ ] `R2_ACCOUNT_ID` — Account ID de Cloudflare
- [ ] `R2_ACCESS_KEY_ID` — API token
- [ ] `R2_SECRET_ACCESS_KEY` — API secret
- [ ] `R2_BUCKET_NAME` — Nombre del bucket R2
- [ ] `R2_CUSTOM_DOMAIN` — Dominio CDN (opcional)

### 🔵 OPCIONALES

- [ ] `LOG_LEVEL=INFO` — Nivel de logging
- [ ] `SECURE_HSTS_PRELOAD=True` — Incluir en HSTS preload list

---

## 📊 Hallazgos Auditados Resueltos

| ID | Título | Severidad | Estado | Tiempo |
|----|--------|-----------|--------|--------|
| B-006 | Backend no parsea DATABASE_URL | CRÍTICA | ✅ | 30 min |
| B-004 | SECRET_KEY fallback inseguro | CRÍTICA | ✅ | 15 min |
| S-001 | Media files efímeros en Render | CRÍTICA | ✅ | 1-2 h |
| F-010 | Frontend Dockerfile usa `dev` en prod | CRÍTICA | ⏳ | 10 min |
| DB-002 | Neon requiere sslmode=require | CRÍTICA | ✅ | 15 min |
| B-008 | CSRF_TRUSTED_ORIGINS faltante | CRÍTICA | ✅ | 10 min |
| B-005 | ALLOWED_HOSTS fallback inseguro | CRÍTICA | ✅ | 10 min |
| SEC-003 | DEBUG podría exponerse en prod | CRÍTICA | ✅ | 5 min |

---

## 📂 Archivos Modificados / Creados

| Archivo | Tipo | Cambios |
|---------|------|---------|
| `backend/config/settings.py` | Modificado | +50 líneas (Neon, R2, seguridad, WhiteNoise) |
| `backend/config/urls.py` | Modificado | +15 líneas (health check endpoint) |
| `backend/requirements.txt` | Modificado | +4 dependencias nuevas |
| `backend/gunicorn_config.py` | Creado | 47 líneas |
| `Procfile` | Creado | 1 línea |
| `.env.example` | Actualizado | +30 líneas de documentación |

---

## 🚀 Pasos Siguientes

### Antes de Commit/Push:

1. ✅ Validar sintaxis de Python → **HECHO**
2. ⏳ Ejecutar `python manage.py check` (requiere entorno)
3. ⏳ Ejecutar `python manage.py collectstatic` (requiere entorno)
4. ✅ Revisar `.env.example` con todas las variables

### Para Deployment en Render:

1. **Crear aplicación en Render**
   - Conectar repo GitHub
   - Environment: Python 3.11+
   - Build command: `pip install -r backend/requirements.txt && python backend/manage.py migrate`
   - Start command: Usar `Procfile`

2. **Configurar Variables de Entorno en Render**
   - Agregar todas las variables del apartado "Checklist"
   - Usar valores reales de Neon + Cloudflare R2

3. **Configurar Neon PostgreSQL**
   - Crear base de datos en Neon
   - Copiar `DATABASE_URL` completo (con `sslmode=require`)
   - Agregar a env vars de Render

4. **Configurar Cloudflare R2**
   - Crear bucket en R2
   - Generar API token (con permisos específicos)
   - Agregar env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
   - Configurar dominio CDN personalizado (opcional)

5. **Frontend en Cloudflare Pages**
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
   - Environment variable: `VITE_API_BASE_URL` → URL del backend en Render

---

## 📞 Soporte

Para dudas sobre la configuración:
- DATABASE_URL Neon: https://neon.tech/docs
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Django deployment: https://docs.djangoproject.com/en/4.2/howto/deployment/
- Render: https://render.com/docs

---

**Generado:** 2026-11-05  
**Por:** Kiro AI  
**Versión:** v0.8.0-implementation-ready

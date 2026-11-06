# ✅ DEPLOYMENT CHECKLIST — Popé v0.8.0

**Sistema:** 4-paso para despliegue en Cloudflare Pages + Render + Neon + R2

**Tiempo estimado:** 4-6 horas (incluye correcciones críticas)

**Dificultad:** ⭐⭐⭐ Intermedia (requiere configuración en 4 servicios)

---

## PASO 1: PREPARAR CÓDIGO (30-60 min)

### 1.1 Actualizar backend/requirements.txt

```bash
# Agregar estas líneas DESPUÉS de las líneas existentes:

# Database URL parsing
dj-database-url==2.1.0

# S3/R2 Storage
django-storages[s3]==1.14.2
boto3==1.28.85

# Commit
git add backend/requirements.txt
git commit -m "deps: add dj-database-url, django-storages, boto3"
```

### 1.2 Actualizar backend/config/settings.py

**Sección 1: Database (reemplazar líneas 77-85)**

```python
# OLD:
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

# NEW:
import dj_database_url

# Intentar parsear DATABASE_URL primero (producción con Neon)
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Fallback a variables individuales (desarrollo local)
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

**Sección 2: SECRET_KEY (reemplazar línea 12)**

```python
# OLD:
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-change-in-production')

# NEW:
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        from django.core.management.utils import get_random_secret_key
        SECRET_KEY = get_random_secret_key()
    else:
        raise ValueError("SECRET_KEY environment variable must be set in production")
```

**Sección 3: CSRF & Security (agregar antes de CORS_ALLOWED_ORIGINS)**

```python
# Agregar después de ALLOWED_HOSTS (línea 17):
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:5173'
).split(',')

# Agregar después de SIMPLE_JWT (línea 140):
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
```

**Sección 4: Storage para R2 (agregar antes del final)**

```python
# Agregar al final de settings.py (antes del logging):
# Media Storage Configuration
if not DEBUG:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'access_key': os.environ.get('R2_ACCESS_KEY_ID'),
                'secret_key': os.environ.get('R2_SECRET_ACCESS_KEY'),
                'bucket_name': os.environ.get('R2_BUCKET_NAME', 'pope-media'),
                'endpoint_url': os.environ.get('R2_ENDPOINT_URL'),
                'url_protocol': 'https:',
                'region_name': 'auto',
            }
        }
    }
```

### 1.3 Actualizar frontend/Dockerfile

```dockerfile
# OLD (línea 32):
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# NEW (para usar con Cloudflare Pages, este Dockerfile no se necesitará realmente)
# Pero si lo mantienes para local, cambiar a:
CMD ["serve", "-s", "dist", "-l", "5173"]
```

### 1.4 Crear archivo frontend/_redirects

```bash
# Crear archivo frontend/_redirects (para Cloudflare Pages SPA routing)
echo '/* /index.html 200' > frontend/_redirects
```

### 1.5 Commit final

```bash
git add backend/config/settings.py frontend/Dockerfile frontend/_redirects
git commit -m "fix: production deployment configuration"
git push origin master
```

✅ **PASO 1 COMPLETADO**

---

## PASO 2: CONFIGURAR SERVICIOS EXTERNOS (2-3 horas)

### 2.1 Crear Base de Datos en Neon

1. Ir a https://console.neon.tech/
2. Sign up / Login
3. Create Project → "pope" o nombre similar
4. Copiar **Connection string**:
   ```
   postgresql://user:password@host.neon.tech/database?sslmode=require
   ```
5. Guardar en un archivo temporal (usaremos en Render)

✅ **Neon creado**

### 2.2 Crear Bucket en Cloudflare R2

1. Ir a https://dash.cloudflare.com/ → R2
2. Create bucket → nombre: `pope-media`
3. En configuración del bucket:
   - CORS Allow → GET, PUT, POST, DELETE
   - Allowed origins → `*` (o especificar Render domain después)
4. Crear API Token:
   - R2 token → Create token
   - Permissions: Read & Write
   - Guardar:
     - Access Key ID
     - Secret Access Key
     - Account ID
     - Endpoint URL: `https://account-id.r2.cloudflarestorage.com`

✅ **R2 creado con credentials**

### 2.3 Crear Proyecto Backend en Render

1. Ir a https://render.com/
2. Sign up / Login
3. Dashboard → New+ → Web Service
4. Connect GitHub repo → seleccionar `tienda-pope`
5. Configurar:
   - **Name:** `pope-api`
   - **Environment:** Python 3.11
   - **Build Command:** 
     ```
     pip install -r backend/requirements.txt && python backend/manage.py migrate
     ```
   - **Start Command:** 
     ```
     gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --chdir /opt/render/project/src/backend
     ```
   - **Root directory:** `backend` (si Render lo detecta automáticamente, OK)

6. **Environment Variables** (crítico):
   ```
   DEBUG = False
   SECRET_KEY = <generar con: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   DATABASE_URL = <copiar desde Neon>
   ALLOWED_HOSTS = pope-api.onrender.com,api.pope.example.com
   CORS_ALLOWED_ORIGINS = https://pope.pages.dev,https://pope.example.com
   CSRF_TRUSTED_ORIGINS = https://pope.pages.dev,https://pope.example.com
   R2_ACCESS_KEY_ID = <desde R2>
   R2_SECRET_ACCESS_KEY = <desde R2>
   R2_BUCKET_NAME = pope-media
   R2_ENDPOINT_URL = <desde R2>
   ```

7. **Auto-deploy:** Habilitar para branch `master`
8. **Crear servicio** y esperar a que compile

✅ **Render backend deployado**

### 2.4 Verificar Backend

```bash
# Esperar a que termine el build (~2-3 min)
# Luego hacer:

curl https://pope-api.onrender.com/api/v1/categories/

# Debe devolver 200 OK con JSON (aunque esté vacío)
```

---

## PASO 3: DESPLEGAR FRONTEND EN CLOUDFLARE PAGES (30 min)

### 3.1 Conectar Cloudflare Pages

1. Ir a https://dash.cloudflare.com/
2. Ir a **Pages** (en el menú lateral)
3. **Create Project** → GitHub
4. Autorizar GitHub
5. Seleccionar repo: `tienda-pope`
6. Configurar:
   - **Project name:** `pope` (o tu preferencia)
   - **Production branch:** `master`
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`

7. **Environment Variables**:
   ```
   VITE_API_URL = https://pope-api.onrender.com/api/v1
   ```

8. **Save & Deploy**

✅ **Frontend en Cloudflare Pages**

### 3.2 Verificar Frontend

```bash
# Acceder a:
https://pope.<account>.pages.dev

# Debe cargar el catálogo sin errores
```

---

## PASO 4: CONFIGURAR DOMINIOS PERSONALIZADOS (1 hora)

### 4.1 Dominio del Backend (Render)

1. En Render → pope-api → Custom Domain
2. Ingresar dominio: `api.pope.example.com` (o tu dominio)
3. Copiar CNAME target que proporciona Render
4. En tu proveedor DNS:
   - Crear registro CNAME:
     ```
     api.pope.example.com CNAME pope-api.onrender.com
     ```
5. Esperar propagación (5-30 min)
6. Actualizar variables en Render:
   ```
   ALLOWED_HOSTS = api.pope.example.com
   ```

### 4.2 Dominio del Frontend (Cloudflare Pages)

1. En Cloudflare Pages → pope → Custom domain
2. Ingresar: `pope.example.com`
3. Si el dominio está en Cloudflare, asignar automáticamente
4. Si no, crear CNAME manualmente

### 4.3 Actualizar Backend CORS/CSRF

Volver a Render → pope-api → Environment Variables:
```
CORS_ALLOWED_ORIGINS = https://pope.example.com,https://www.pope.example.com
CSRF_TRUSTED_ORIGINS = https://pope.example.com,https://www.pope.example.com
```

✅ **Dominios configurados**

---

## PASO 5: VERIFICACIÓN FINAL (30 min)

### Checklist de Funcionamiento

- [ ] **Frontend carga:** https://pope.example.com/
- [ ] **Catálogo visible:** Productos se cargan
- [ ] **API responde:** GET https://api.pope.example.com/api/v1/categories/
- [ ] **Admin accesible:** https://pope.example.com/admin/login
- [ ] **Admin login funciona:** Con email/contraseña
- [ ] **Dashboard carga:** Métricas visibles
- [ ] **Crear orden:** Carrito → Checkout → Confirmación
- [ ] **Órdenes en admin:** Visible en /admin/orders
- [ ] **Imágenes desde R2:** No hay 404 en imágenes de productos
- [ ] **HTTPS:** Todo en HTTPS, sin warnings
- [ ] **Sin CORS errors:** Revisar console de navegador

### Comandos de Verificación

```bash
# 1. Verificar backend
curl https://api.pope.example.com/api/v1/categories/

# 2. Verificar CORS
curl -H "Origin: https://pope.example.com" \
     -H "Access-Control-Request-Method: GET" \
     https://api.pope.example.com/api/v1/products/

# 3. Verificar SSL
curl -vI https://pope.example.com/ | grep "SSL"

# 4. Verificar DNS
nslookup api.pope.example.com
nslookup pope.example.com
```

---

## PASO 6: CONFIGURACIÓN POST-DEPLOY (opcional, pero recomendado)

### 6.1 Crear Admin User

En Render shell:
```bash
python manage.py createsuperuser

# Seguir prompts para crear usuario admin
# Usar un email real para recuperación
```

### 6.2 Cargar Datos Iniciales

En Render shell o Django shell:
```python
python manage.py shell

# Crear categorías:
from apps.categories.models import Category
Category.objects.create(
    name="Desinfectantes",
    slug="desinfectantes",
    description="Productos de desinfección"
)

Category.objects.create(
    name="Detergentes",
    slug="detergentes",
    description="Detergentes y limpiadores"
)

# O cargar desde fixture si existe
# python manage.py loaddata fixture.json
```

### 6.3 Habilitar Monitoreo

- Configurar logs en Render dashboard
- Habilitar alertas si algo falla
- Revisar logs regularmente

---

## 🆘 TROUBLESHOOTING

### Error: "Connection refused" en base de datos

**Causa:** DATABASE_URL mal formado o Neon no responde

**Solución:**
1. Verificar `DATABASE_URL` en Render env vars
2. Copiar exactamente desde Neon console
3. Incluir `?sslmode=require`
4. Reiniciar servicio en Render

### Error: "403 Forbidden" en uploads a R2

**Causa:** Credenciales R2 incorrectas o permisos insuficientes

**Solución:**
1. Regenerar API token en R2
2. Verificar permisos: Read & Write
3. Verificar nombre exacto del bucket
4. Reiniciar Render

### Error: "CORS Error" en frontend

**Causa:** CORS_ALLOWED_ORIGINS no incluye dominio del frontend

**Solución:**
1. En Render env vars, agregar dominio de frontend
2. Incluir http:// y https://
3. Reiniciar servicio
4. Limpiar cache del navegador

### Imágenes no cargan (404)

**Causa:** Media files no están en R2 o R2 no está configurado

**Solución:**
1. Verificar configuración STORAGES en settings.py
2. Verificar env vars de R2
3. Subir imagen de prueba desde admin
4. Verificar URL en Developer Tools

---

## 📊 RESUMEN

| Tarea | Duración | Servicio | Status |
|-------|----------|----------|--------|
| 1. Código + dependencias | 1 hr | GitHub | ⏳ |
| 2. Neon Database | 15 min | Neon | ⏳ |
| 2. R2 Bucket | 30 min | Cloudflare | ⏳ |
| 2. Render Backend | 1 hr | Render | ⏳ |
| 3. Cloudflare Pages | 30 min | Cloudflare | ⏳ |
| 4. Dominios | 1 hr | DNS | ⏳ |
| 5. Verificación | 30 min | Total | ⏳ |
| **TOTAL** | **4-6 hrs** | **Todos** | **🚀** |

---

## 🎊 ¡COMPLETADO!

Una vez terminados estos 6 pasos, tu aplicación Popé estará en producción. 🚀

**Próximos pasos:**
- Monitorear logs en Render
- Crear contenido (categorías, productos)
- Compartir URL con clientes
- Recolectar feedback

---

**¿Necesitas ayuda?** Revisar `docs/AUDITORIA_PRE_DEPLOY.md` para detalles completos.


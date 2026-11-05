# Fase 2: Catálogo - Completada ✅

**Fecha:** 5 de Noviembre, 2026  
**Status:** Implementado y listo para testing  
**Tareas Completadas:** 2.1, 2.2, 2.3

---

## Descripción

Fase 2 implementa el catálogo de productos con categorización, búsqueda avanzada y compresión de imágenes.

## Tareas Completadas

### 2.1 Backend: Endpoints de Categorías ✅

**Modelo:** `Category`
- `id` (PK)
- `name` (unique, max 100)
- `slug` (auto-generated from name)
- `description` (TextField, opcional)
- `image` (ImageField, opcional)
- `is_active` (Boolean, default=True)
- `order` (PositiveInt, para ordenar en UI)
- `created_at`, `updated_at` (timestamps)

**ViewSet:** `CategoryViewSet`
- GET `/api/v1/categories/` → Listar categorías activas
- POST `/api/v1/categories/` → Crear (admin only)
- GET `/api/v1/categories/{id}/` → Detalle
- PATCH `/api/v1/categories/{id}/` → Actualizar (admin only)
- DELETE `/api/v1/categories/{id}/` → Eliminar (admin only)
- GET `/api/v1/categories/active/` → Solo activas
- POST `/api/v1/categories/{id}/toggle_active/` → Alternar estado (admin only)

**Permisos:**
- Lectura: Pública (solo activas para usuarios no-admin)
- Escritura: Admin only

---

### 2.2 Backend: Endpoints de Productos + Búsqueda/Filtrado ✅

**Modelo:** `Product`
- `id` (PK)
- `name` (max 200)
- `slug` (unique, auto-generated)
- `description` (TextField)
- `category` (FK → Category)
- `sku` (unique, max 100)
- `price` (Decimal, min 0.01)
- `discount_percentage` (Decimal, 0-100%)
- `image` (ImageField)
- `image_thumbnail` (ImageField, auto-generated)
- `stock` (PositiveInt)
- `is_active` (Boolean, default=True)
- `is_featured` (Boolean, default=False)
- `rating` (Decimal, 0-5)
- `rating_count` (PositiveInt)
- `created_at`, `updated_at` (timestamps)

**Propiedades computadas:**
- `discounted_price` → price - (price × discount_percentage/100)
- `in_stock` → stock > 0

**ViewSet:** `ProductViewSet`

**Endpoints principales:**
- GET `/api/v1/products/` → Listar productos (paginado)
- POST `/api/v1/products/` → Crear (admin only)
- GET `/api/v1/products/{id}/` → Detalle con categoría completa
- PATCH `/api/v1/products/{id}/` → Actualizar (admin only)
- DELETE `/api/v1/products/{id}/` → Eliminar (admin only)
- POST `/api/v1/products/{id}/toggle_featured/` → Alternar destacado (admin only)

**Endpoints de búsqueda y filtrado:**
- GET `/api/v1/products/featured/` → Top 10 productos destacados
- GET `/api/v1/products/search/` → Búsqueda avanzada con filtros
- GET `/api/v1/products/by_category/?category_id=X` → Por categoría

**Búsqueda avanzada** (`/search/`):
```
Parámetros opcionales:
- q: Término de búsqueda (busca en name, description, sku)
- category_id: Filtro por categoría
- min_price: Precio mínimo (ARS)
- max_price: Precio máximo (ARS)
- in_stock: true/false (solo con stock)
- sort: Campo para ordenar (price, -price, rating, -rating, name, -name, created_at, -created_at)

Ejemplos:
GET /api/v1/products/search/?q=desinfectante&in_stock=true
GET /api/v1/products/search/?category_id=1&min_price=100&max_price=500&sort=-rating
GET /api/v1/products/search/?q=limpiador&sort=price
```

**Filtros DRF integrados:**
- `category`: Filtro por categoría
- `is_active`: Solo activos
- `is_featured`: Solo destacados
- `search`: Búsqueda por nombre/descripción/SKU
- `ordering`: Ordenar por campos

**Serializadores:**
- `ProductSerializer` → Completo (crear/actualizar)
- `ProductListSerializer` → Simplificado para listados (menos datos)
- `ProductDetailSerializer` → Detallado con categoría completa

**Permisos:**
- Lectura: Pública (solo activos para no-admin)
- Escritura: Admin only

---

### 2.3 Backend: Compresión de Imágenes con Pillow ✅

**Ubicación:** `Product.save()` con método privado `_compress_image()`

**Funcionalidad:**
1. Redimensionar a máximo 800x600px (mantiene aspecto ratio)
2. Convertir a JPEG con calidad 85 (balance tamaño/calidad)
3. Guardar automáticamente como `image_thumbnail`
4. Manejo de excepciones (no interrumpe guardado si falla)

**Soporte:**
- Formatos: JPEG, PNG, WEBP (convertidos automáticamente)
- Canales: RGB, RGBA (RGBA convertido a RGB con fondo blanco)
- Repositorio: `media/products/thumbnails/`

**Ventajas:**
- No requiere servicios externos (S3, Cloudinary)
- Reduce tamaño de descarga (frontend más rápido)
- Almacenamiento local simplificado

---

## Estructura de Archivos

```
backend/apps/
├── categories/
│   ├── __init__.py
│   ├── models.py          # Modelo Category
│   ├── views.py           # CategoryViewSet
│   ├── serializers.py     # Serializadores
│   ├── urls.py            # Rutas
│   ├── admin.py           # Registro Django admin
│   ├── apps.py
│   └── tests.py
├── products/
│   ├── __init__.py
│   ├── models.py          # Modelo Product con compresión
│   ├── views.py           # ProductViewSet con búsqueda avanzada
│   ├── serializers.py     # Serializadores
│   ├── urls.py            # Rutas
│   ├── admin.py           # Registro Django admin
│   ├── apps.py
│   └── tests.py
└── ...

backend/
├── config/
│   ├── settings.py        # Actualizado con apps y django-filter
│   └── urls.py            # Rutas v1
└── requirements.txt       # + django-filter==24.1
```

---

## Cambios en Configuración

### `settings.py`
- Agregado `'apps.categories'` a `INSTALLED_APPS`
- Agregado `'apps.products'` a `INSTALLED_APPS`
- Agregado `'django_filters'` a `INSTALLED_APPS`
- Configurado `DEFAULT_FILTER_BACKENDS` en REST_FRAMEWORK

### `requirements.txt`
- Agregado `django-filter==24.1`

### `urls.py`
- Agregado `path('api/v1/categories/', include('apps.categories.urls'))`
- Agregado `path('api/v1/products/', include('apps.products.urls'))`

---

## Testing

### Tests Incluidos

**Categories:**
```python
# test_category_creation()
# test_category_string_representation()
```

**Products:**
```python
# test_product_creation()
# test_discount_calculation()
# test_product_string_representation()
```

**Ejecutar tests:**
```bash
python manage.py test apps.categories
python manage.py test apps.products
```

---

## Próximos Pasos (Fase 2 Pendiente)

### 2.4 Frontend: Página de Catálogo
- Grid responsivo (2 cols mobile → 4 cols desktop)
- Integración con API `/products/`
- Filtros por categoría
- Ordenamiento por precio/rating

### 2.5 Frontend: Página de Detalle del Producto
- Detalle individual `/products/{slug}`
- Galería de imágenes (si hay múltiples)
- Stock disponible
- Botón "Agregar al carrito"
- Reseñas (placeholder)

---

## Notas Técnicas

### Permisos y Autorización
- **IsAuthenticatedOrReadOnly**: Lectura pública, escritura solo autenticado
- **Admin check**: Uso de `request.user.is_staff` en `perform_*` methods
- **Queryset filtering**: Admins ven todo; público ve solo `is_active=True`

### Filtrado y Búsqueda
- Django Filters + DRF Filters para flexibilidad
- Búsqueda por Q objects (OR logic en name/description/sku)
- Ordenamiento configurable vía `ordering_fields`

### Rendimiento
- **Indexes**: ForeignKey (category), BooleanField (is_active), SlugField (slug)
- **select_related()**: Evitar N+1 queries en Category
- **Thumbnail caching**: ImageField cachea a nivel de DB

### Almacenamiento de Imágenes
- `MEDIA_URL = '/media/'` → `/media/products/%Y/%m/image.jpg`
- `MEDIA_ROOT = BASE_DIR / 'media'` → Volumen Docker `backend_media`
- Thumbnails: `media/products/thumbnails/image_thumb.jpg`

---

## Commits

1. **"Fase 2: Modelo de Categorías - ViewSet, Serializadores y Admin"**
2. **"Fase 2: Modelo de Productos - Compresión de imágenes y ViewSet avanzado"**
3. **"Fase 2: Integración de URLs y Configuración de django-filter"**

---

## Validación

```bash
# Verificar apps registradas
python manage.py shell
>>> from django.conf import settings
>>> 'apps.categories' in settings.INSTALLED_APPS  # True
>>> 'apps.products' in settings.INSTALLED_APPS    # True

# Ejecutar migraciones (después en Fase 3)
python manage.py makemigrations
python manage.py migrate

# Cargar datos de prueba (después crear fixture)
python manage.py loaddata seed_categories seed_products

# Correr servidor
python manage.py runserver
# Navegar a http://localhost:8000/api/v1/categories/
# Navegar a http://localhost:8000/api/v1/products/
```

---

**Fase 2 lista para integración con frontend y testing E2E.**

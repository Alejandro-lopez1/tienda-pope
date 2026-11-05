# TASKS - Tienda Online Popé (48 Tareas Verificadas)

## Verificación de Alcance

✅ Cada tarea es **específica, concreta e implementable**
✅ Todas las tareas **respetan el MVP original** (sin features adicionales)
✅ **No hay sobreingeniería:** Stack simple, dependencias mínimas
✅ **Mobile-first:** Priorizadas tareas de UX móvil
✅ **Alcance confirmado:** 48 tareas distribuidas en 8 fases

---

## FASE 1: Fundaciones (Semana 1)

### Task 1.1: Inicializar estructura y Docker Compose
- [ ] Crear estructura de directorios: `backend/`, `frontend/`
- [ ] Crear `docker-compose.yml` con servicios (PostgreSQL, Django, Vite)
- [ ] Crear `.dockerignore` y `.gitignore`
- [ ] Crear `.env.example` con variables
- [ ] Verificar que `docker-compose up` completa sin errores
- [ ] Verificación: Servicios corriendo, BD accesible

### Task 1.2: Backend - Configuración inicial Django
- [ ] Crear venv Python 3.11+
- [ ] Instalar dependencias (Django, DRF, psycopg2, JWT, Pillow, reportlab, openpyxl)
- [ ] Crear proyecto Django
- [ ] Configurar `settings.py` (BD, CORS, JWT)
- [ ] Crear archivo `.env`
- [ ] Ejecutar migraciones
- [ ] Crear superuser temporario
- [ ] Verificación: `python manage.py runserver` sin errores

### Task 1.3: Frontend - Configuración inicial React + Vite
- [ ] Crear proyecto con Vite
- [ ] Instalar dependencias (Tailwind, axios, react-router-dom)
- [ ] Configurar Tailwind
- [ ] Crear estructura de carpetas
- [ ] Verificación: `npm run dev` sin errores

### Task 1.4: Base de datos - Crear modelos Django
- [ ] Crear modelo AdminUser
- [ ] Crear modelo Category
- [ ] Crear modelo Product
- [ ] Crear modelo Order, OrderItem, OrderStatusAudit
- [ ] Crear modelo SystemSettings
- [ ] Crear migraciones y ejecutar
- [ ] Verificación: Tablas creadas en BD

### Task 1.5: Autenticación - Backend JWT
- [ ] Crear serializer LoginSerializer
- [ ] Crear viewset AuthViewSet
- [ ] Configurar JWT settings
- [ ] Crear middleware de autenticación
- [ ] Tests unitarios
- [ ] Verificación: Endpoint responde correctamente

### Task 1.6: Autenticación - Frontend
- [ ] Crear contexto AuthContext
- [ ] Crear hook useAuth()
- [ ] Crear página /admin/login
- [ ] Crear componente ProtectedRoute
- [ ] Crear servicio authService.ts
- [ ] Tests
- [ ] Verificación: Login page funcional

---

## FASE 2: Catálogo y Productos (Semana 2)

### Task 2.1: Backend - Endpoints de categorías
- [ ] Crear serializer CategorySerializer
- [ ] Crear viewset CategoryViewSet (GET, POST, PATCH, DELETE)
- [ ] Configurar permisos
- [ ] Tests
- [ ] Verificación: Endpoints funcionales

### Task 2.2: Backend - Endpoints de productos
- [ ] Crear serializer ProductSerializer
- [ ] Crear viewset ProductViewSet (GET, POST, PATCH, DELETE)
- [ ] Configurar filtros y búsqueda
- [ ] Implementar paginación
- [ ] Tests
- [ ] Verificación: Endpoints y filtros funcionales

### Task 2.3: Backend - Compresión de imágenes
- [ ] Crear utilidad image_handler.py
- [ ] Implementar resize automático
- [ ] Implementar validación MIME
- [ ] Integrar en ProductSerializer.save()
- [ ] Tests
- [ ] Verificación: Imágenes comprimidas

### Task 2.4: Frontend - Catálogo público
- [ ] Crear página Catalog.tsx
- [ ] Crear componente CategoryTabs
- [ ] Crear componente ProductGrid
- [ ] Crear componente ProductCard
- [ ] Implementar búsqueda con debounce
- [ ] Tests
- [ ] Verificación: Catálogo funcional

### Task 2.5: Frontend - Detalles de producto
- [ ] Crear página ProductDetail.tsx
- [ ] Selector de cantidad
- [ ] Botón "Agregar al carrito"
- [ ] Tests
- [ ] Verificación: Página funcional

---

## FASE 3: Carrito y Pedidos (Semana 2-3)

### Task 3.1: Frontend - Carrito (localStorage)
- [ ] Crear hook useCart.ts
- [ ] Implementar persistencia en localStorage
- [ ] Tests
- [ ] Verificación: Hook funcional

### Task 3.2: Frontend - Página del carrito
- [ ] Crear página Cart.tsx
- [ ] Listado de items con controles +/-
- [ ] Resumen y botones
- [ ] Tests
- [ ] Verificación: Página funcional

### Task 3.3: Frontend - Checkout
- [ ] Crear página Checkout.tsx
- [ ] Formulario con validación
- [ ] Tests
- [ ] Verificación: Formulario funcional

### Task 3.4: Backend - Crear pedido
- [ ] Crear serializer CreateOrderSerializer
- [ ] Endpoint POST /api/v1/orders/
- [ ] Validaciones backend (precios, disponibilidad)
- [ ] Generar order_number único
- [ ] Transacción: Order + OrderItems
- [ ] Tests
- [ ] Verificación: Endpoint funcional

### Task 3.5: Backend - Serializers y validadores
- [ ] Crear serializers (Order, OrderItem)
- [ ] Crear validadores custom
- [ ] Crear generator de order_number
- [ ] Tests
- [ ] Verificación: Validaciones funcionan

---

## FASE 4: PDF y WhatsApp (Semana 3)

### Task 4.1: Backend - Generador de PDF
- [ ] Instalar reportlab
- [ ] Crear utilidad pdf_generator.py
- [ ] Generar PDF con contenido completo
- [ ] Tests
- [ ] Verificación: PDF genera

### Task 4.2: Backend - Endpoint de descarga PDF
- [ ] Crear endpoint GET /api/v1/orders/<order_number>/pdf/
- [ ] Validaciones
- [ ] Tests
- [ ] Verificación: Descarga funciona

### Task 4.3: Backend - Generar URL de WhatsApp
- [ ] Crear utilidad whatsapp_helper.py
- [ ] Generar enlace wa.me
- [ ] Incluir en respuesta POST /api/v1/orders/
- [ ] Tests
- [ ] Verificación: Links funcionales

### Task 4.4: Frontend - Pantalla de confirmación
- [ ] Crear página OrderConfirmation.tsx
- [ ] Mostrar información pedido
- [ ] Botones descargar PDF y abrir WhatsApp
- [ ] Limpiar localStorage
- [ ] Tests
- [ ] Verificación: Confirmación funcional

### Task 4.5: Frontend - Integración de descarga y WhatsApp
- [ ] Crear fileService.ts
- [ ] Crear whatsappService.ts
- [ ] Integrar en OrderConfirmation
- [ ] Tests
- [ ] Verificación: Servicios funcionan

---

## FASE 5: Panel Admin (Semana 4)

### Task 5.1: Backend - Endpoints de pedidos (admin)
- [ ] Crear serializer AdminOrderSerializer
- [ ] Endpoints GET, GET/<id>, PATCH confirm, PATCH cancel
- [ ] Filtros (estado, fecha, búsqueda)
- [ ] Registrar cambios en audit
- [ ] Tests
- [ ] Verificación: Endpoints funcionales

### Task 5.2: Frontend - Autenticación completada
- [ ] Mejorar useAuth (refresh automático)
- [ ] Crear apiService.ts
- [ ] Interceptors JWT
- [ ] Tests
- [ ] Verificación: Autenticación robusta

### Task 5.3: Frontend - Dashboard admin
- [ ] Crear página Dashboard.tsx
- [ ] Layout AdminLayout
- [ ] KPIs (4 cards)
- [ ] Últimos pedidos
- [ ] Botones de acción rápida
- [ ] Tests
- [ ] Verificación: Dashboard funcional

### Task 5.4: Frontend - Listado de pedidos
- [ ] Crear página Orders.tsx
- [ ] Filtros (estado, fecha, búsqueda)
- [ ] Tabla responsive
- [ ] Acciones por fila
- [ ] Paginación
- [ ] Tests
- [ ] Verificación: Listado funcional

### Task 5.5: Frontend - Detalles de pedido
- [ ] Crear página OrderDetail.tsx
- [ ] Mostrar información completa
- [ ] Historial de cambios (timeline)
- [ ] Botones acciones
- [ ] Modal de confirmación
- [ ] Tests
- [ ] Verificación: Detalles funcionales

### Task 5.6: Frontend - Gestión de productos (admin)
- [ ] Crear página Products.tsx
- [ ] Listado con filtros
- [ ] Switches inline
- [ ] Paginación
- [ ] Tests
- [ ] Verificación: Gestión funcional

### Task 5.7: Frontend - Formulario de producto
- [ ] Crear página ProductForm.tsx
- [ ] Formulario con validación
- [ ] Upload de imagen con preview
- [ ] Tests
- [ ] Verificación: Formulario funcional

### Task 5.8: Frontend - Gestión de categorías (admin)
- [ ] Crear página Categories.tsx
- [ ] Listado simple
- [ ] CRUD en modal
- [ ] Validación: no eliminar si tiene productos
- [ ] Tests
- [ ] Verificación: Gestión funcional

---

## FASE 6: Reportes y Exportación (Semana 5)

### Task 6.1: Backend - Exportador XLSX
- [ ] Instalar openpyxl
- [ ] Crear utilidad xlsx_exporter.py
- [ ] Generar XLSX con estructura correcta
- [ ] Tests
- [ ] Verificación: XLSX genera

### Task 6.2: Backend - Endpoint de exportación
- [ ] Crear endpoint GET /api/v1/admin/reports/orders/export/
- [ ] Filtros (estado, fecha)
- [ ] Tests
- [ ] Verificación: Descarga funciona

### Task 6.3: Frontend - Página de reportes
- [ ] Crear página Reports.tsx
- [ ] Filtros (fecha, estado)
- [ ] Preview tabla
- [ ] Botón descargar
- [ ] Tests
- [ ] Verificación: Reportes funcionales

### Task 6.4: Backend - Endpoint de dashboard (KPIs)
- [ ] Crear endpoint GET /api/v1/admin/dashboard/
- [ ] Calcular KPIs
- [ ] Tests
- [ ] Verificación: Dashboard actualiza

---

## FASE 7: Configuración y PWA (Semana 5)

### Task 7.1: Backend - Endpoints de configuración
- [ ] Crear serializer SystemSettingsSerializer
- [ ] Endpoints GET y PATCH
- [ ] Validaciones
- [ ] Tests
- [ ] Verificación: Settings funcionales

### Task 7.2: Frontend - Página de configuración
- [ ] Crear página Settings.tsx
- [ ] Secciones (identidad, contacto, horarios, colores)
- [ ] Formularios
- [ ] Tests
- [ ] Verificación: Settings funcional

### Task 7.3: PWA - Manifest
- [ ] Crear public/manifest.json
- [ ] Crear iconos (192x192, 512x512)
- [ ] Agregar referencias en index.html
- [ ] Tests
- [ ] Verificación: Manifest válido

### Task 7.4: PWA - Service Worker
- [ ] Crear public/service-worker.ts
- [ ] Cache de assets
- [ ] Strategy cache-first
- [ ] Update handling
- [ ] Tests
- [ ] Verificación: Service worker funcional

### Task 7.5: PWA - Instalación
- [ ] Verificar en Android (Chrome)
- [ ] Verificar en iOS (Safari)
- [ ] Tests manuales
- [ ] Verificación: PWA instalable

---

## FASE 8: Testing, Documentación y Despliegue (Semana 6)

### Task 8.1: Tests Backend
- [ ] Tests unitarios (modelos, serializers)
- [ ] Tests de integración (endpoints)
- [ ] Tests de negocio (lógica)
- [ ] Cobertura 80%+
- [ ] Verificación: Tests pasan

### Task 8.2: Tests Frontend
- [ ] Tests de componentes
- [ ] Tests de hooks
- [ ] Tests de páginas
- [ ] Tests de servicios
- [ ] Cobertura 70%+
- [ ] Verificación: Tests pasan

### Task 8.3: Tests E2E
- [ ] Flujo de compra completo
- [ ] Flujo admin completo
- [ ] Usando Cypress o Playwright
- [ ] Verificación: Tests pasan

### Task 8.4: Documentación
- [ ] README.md
- [ ] API Docs (Swagger)
- [ ] Guía de configuración
- [ ] Guía para propietario
- [ ] Developer guide
- [ ] Verificación: Docs completa

### Task 8.5: Optimización
- [ ] Compresión de imágenes
- [ ] Tree shaking y code splitting
- [ ] Paginación y debounce
- [ ] Audit Lighthouse (>90)
- [ ] Verificación: Performance >90

### Task 8.6: Preparación para despliegue
- [ ] Seguridad (HTTPS, CORS, secrets)
- [ ] Backups BD
- [ ] Migraciones iniciales
- [ ] Monitoreo básico
- [ ] Docs de despliegue
- [ ] Verificación: Ready to deploy

---

## Resumen Ejecutivo

- **Total de tasks:** 48 tareas
- **Alcance:** Verificado contra MVP original ✅
- **Sobreingeniería:** Evitada ✅
- **Mobile-first:** Priorizadas tareas móvil ✅
- **Timeline:** 6-8 semanas
- **Dependencias:** Mínimas, stack simple

**Próximo paso:** Aprobación de spec + comenzar Fase 1.

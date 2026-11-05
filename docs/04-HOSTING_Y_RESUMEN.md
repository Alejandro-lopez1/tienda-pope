# Hosting + Resumen Final

## 1. Opciones de Hosting Recomendadas

### Opción A: Railway (RECOMENDADO PARA MVP)
**Características:**
- PostgreSQL administrado (12GB gratis)
- Django automatizado con Dockerfile
- Frontend estático
- Git integration (deploy automático)
- SSL incluido
- Muy fácil de usar

**Costos:**
- Tier gratuito: Suficiente para MVP
- Tier pago: ~$25/mes (muy económico)

**Ventajas:**
- ✅ Super simple (conectar GitHub y listo)
- ✅ Escalable cuando sea necesario
- ✅ Libre de complejidad DevOps

**Setup:** 
1. Conectar repo a Railway
2. Agregar PostgreSQL add-on
3. Configurar env vars
4. Deploy automático con cada push

**URL:** https://railway.app

---

### Opción B: DigitalOcean App Platform
**Características:**
- PostgreSQL administrado
- Soporte para Python + Node
- SSL incluido
- Backups automáticos

**Costos:**
- Tier starter: ~$5/mes (muy barato)
- PostgreSQL: ~$5/mes

**Ventajas:**
- ✅ Affordable
- ✅ Documentación clara
- ✅ Control más granular

**Setup:** Más manual que Railway pero documentado

**URL:** https://www.digitalocean.com

---

### Opción C: Render
**Características:**
- Similar a Railway
- PostgreSQL administrado
- Muy fácil de usar

**Costos:**
- Tier gratuito (con limitaciones)
- Tier pagado: ~$12/mes

**Ventajas:**
- ✅ Interfaz amigable
- ✅ Buen balance facilidad/precio

---

## 2. Mi Recomendación

**Para Popé: Railway**

**Por qué:**
1. **Simplicidad:** No necesita DevOps
2. **Costo:** $25/mes máximo (todo incluido)
3. **Escalabilidad:** Crece con el negocio sin migraciones
4. **PostgreSQL administrado:** Backups automáticos
5. **SSL:** Incluido, HTTPS es automático
6. **Deploy:** Git push → automático
7. **Soporte:** Comunidad fuerte

**Arquitectura en Railway:**
```
┌─────────────────┐
│  GitHub Repo    │
│                 │
└────────┬────────┘
         │ (webhook automático)
         │
         ▼
┌─────────────────────────────┐
│  Railway                    │
├─────────────────────────────┤
│ Service 1: Backend Django   │
│ - Python 3.11               │
│ - Gunicorn + port 8000      │
│ - Media files en storage    │
├─────────────────────────────┤
│ Service 2: Frontend Vite    │
│ - Build estático            │
│ - Servido por Nginx         │
│ - CDN integrado             │
├─────────────────────────────┤
│ PostgreSQL 15               │
│ - Backups diarios           │
│ - SSL connection            │
└─────────────────────────────┘
```

**Setup estimar:** 30 minutos

---

## 3. Procedimiento de Migración de Catálogo

### Paso 1: Extraer datos de Kyte
**Opción A (Preferida):** Exportar de Kyte Web
- Kyte permite exportar "Products Report"
- Acceder a Kyte Web → Reportes → Descargar CSV
- Archivo CSV contendrá: nombre, descripción, precio, categoría

**Opción B (Si Kyte no lo permite):**
- Propietario copia productos manualmente
- O enviá lista Excel con datos

### Paso 2: Preparar datos
- Revisar integridad: nombres no vacíos, precios válidos
- Validar categorías: crear si no existen
- Normalizar: eliminar duplicados, espacios extra

### Paso 3: Crear endpoint de importación (temporal)
```python
# POST /api/v1/admin/import-csv/
# Sube archivo CSV
# Valida e importa productos
# Disponible solo en desarrollo, desactiva en producción
```

### Paso 4: Validar
- Verificar: todos los productos en BD
- Verificar: precios correctos
- Verificar: categorías asignadas
- Eliminar endpoint de importación

### Paso 5: Cargar imágenes
- Propietario descarga imágenes de Kyte (si es posible)
- Sube a través del panel admin
- O script que descargue automáticamente desde URLs

---

## 4. Sobreingeniería Evitada

En el proyecto se han evitado deliberadamente:

- ❌ Microservicios (monolito es mejor para MVP)
- ❌ GraphQL (REST es suficiente)
- ❌ Cache complejo (simple es mejor)
- ❌ Kubernetes (overkill para MVP)
- ❌ Load balancing (no necesario aún)
- ❌ Queue workers (procesamiento síncrono)
- ❌ Real-time (WebSockets no necesarios)
- ❌ Multi-tenant (un solo propietario)
- ❌ Multiple admins (un solo usuario)
- ❌ Dark mode (fuera de MVP)
- ❌ Internacionalización (solo español)
- ❌ Analytics avanzados (solo KPIs básicos)

**Stack Resultante:**
- Simple ✅
- Mantenible ✅
- Escalable ✅
- Económico ✅

---

## 5. Checklist Previo a Implementación

Antes de ejecutar Fase 1, confirmar:

- [ ] Logo de Popé disponible (encontrado ✅)
- [ ] Paleta de colores extraída (hecho ✅)
- [ ] Número WhatsApp confirmado (✅ +54 9 376 471-0683)
- [ ] Mensaje WhatsApp aprobado (✅)
- [ ] Horarios: A ser completados por propietario (después del MVP)
- [ ] Catálogo existente: Disponible en Kyte (migración manual)
- [ ] Hosting: Railway recomendado (decisión pendiente)
- [ ] Requirements aprobado ✅
- [ ] Design aprobado ✅
- [ ] Tasks aprobado ✅

**Dependencias bloqueantes:**
1. Aprobación de estas 3 especificaciones (Requirements, Design, Tasks)
2. Decisión sobre hosting (aunque Railway es default)
3. Disponibilidad de datos de Kyte (para migración)

---

## 6. Cronograma Estimado

```
Semana 1: Fundaciones (Tasks 1.1-1.6)
├─ Docker setup
├─ Django initial setup
├─ React setup
├─ BD models
└─ JWT auth

Semana 2: Catálogo (Tasks 2.1-2.5)
├─ Endpoints categorías y productos
├─ Compresión de imágenes
├─ Catálogo público
└─ Detalles de producto

Semana 2-3: Carrito y Pedidos (Tasks 3.1-3.5)
├─ Carrito en localStorage
├─ Página checkout
├─ Crear pedido (backend)
└─ Validadores

Semana 3: PDF y WhatsApp (Tasks 4.1-4.5)
├─ Generador PDF
├─ Endpoint descarga
├─ Links WhatsApp
├─ Confirmación UI
└─ Integración

Semana 4: Panel Admin (Tasks 5.1-5.8)
├─ Endpoints pedidos
├─ Dashboard
├─ Gestión productos/categorías
└─ Detalles y formularios

Semana 5: Reportes y PWA (Tasks 6.1-7.5)
├─ Exportación XLSX
├─ Reportes UI
├─ Manifest
├─ Service Worker
└─ Configuración

Semana 6: Testing y Despliegue (Tasks 8.1-8.6)
├─ Tests backend
├─ Tests frontend
├─ Tests E2E
├─ Documentación
├─ Optimización Lighthouse
└─ Preparación deploy
```

**Timeline realista:** 6-8 semanas (con buffer para ajustes)

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|------------|-----------|
| Datos incompletos de Kyte | Media | Script de importación flexible, validaciones de datos |
| Imágenes muy grandes | Alta | Compresión automática en backend, client-side preview |
| Disponibilidad binaria (race condition) | Baja | Validación al crear pedido, no hay stock por cantidad |
| Pérdida de datos | Baja | Backups automáticos en Railway, transacciones BD |
| Admin olvida contraseña | Baja | Reset link via email (post-MVP) |
| Cambios de requerimientos | Media | Enfoque incremental, spec-driven |

---

## 8. Decisiones Finales Pendientes

1. **¿Aprobás Requirements, Design y Tasks tal como están?**
2. **¿Quieres comenzar con Railway o explorar otras opciones?**
3. **¿Puedes exportar catálogo de Kyte o prefieres cargarlo manualmente?**
4. **¿Cuándo querés comenzar la Fase 1?**

---

## Resumen Ejecutivo

✅ **Propuesta técnica aprobada**
✅ **Especificaciones completas y documentadas**
✅ **48 tareas concretas, verificadas contra MVP**
✅ **Arquitectura simple y escalable**
✅ **Alcance controlado, sin sobreingeniería**
✅ **Timeline realista: 6-8 semanas**
✅ **Hosting económico recomendado (Railway)**
✅ **Mobile-first, experiencia de propietario prioritaria**

---

## Próximos Pasos

1. **Confirmá que las 3 especificaciones son correctas**
2. **Respondé las 4 decisiones finales pendientes**
3. **Comenzamos Fase 1: Fundaciones**

Una vez confirmado, crearemos la estructura del proyecto y ejecutaremos las primeras tareas de forma incremental.

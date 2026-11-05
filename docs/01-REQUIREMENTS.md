# REQUIREMENTS - Tienda Online Popé

## 1. Identidad Comercial

### Nombre comercial
- **Nombre:** Popé
- **Ubicación de servicio:** Posadas, Garupá, Candelaria
- **Logo:** Proporcionado (logo_pope.jpg)
- **Paleta de colores corporativos (extraída del logo):**
  ```
  Verde lima:     #7DC41F
  Naranja:        #FF9D00
  Azul cian:      #0DC7D1
  Rojo coral:     #FF4757 (color principal)
  Gris oscuro:    #2C3E50
  ```

### Configuración de marca
- **Logo:** Visible en header del catálogo y en comprobantes PDF
- **Colores:** Centralizados en variables CSS (Tailwind, root variables o archivo de tema)
- **Fuente:** Sistema (Segoe UI, Roboto, sin custom fonts para speed)
- **Responsable:** Propietario puede cambiar logo/colores desde panel admin

### Horarios de atención
- **Estado:** Todavía no confirmados por propietario
- **Implementación:** Configurables desde panel admin
- **Formato:** JSON con horarios por día (lunes a domingo)
- **Visualización:** Mostrar en catálogo ("Abierto ahora" / "Cerrado")
- **No inventar:** Campo editable para que propietario ingrese horarios

### Contacto WhatsApp
- **Número:** +54 9 376 471-0683
- **No hardcodear:** Configurable desde panel admin
- **Mensaje preformateado:** "Hola, quiero consultar por el pedido #[NUMERO_PEDIDO], realizado desde la tienda online. Adjunto el comprobante para validar la operación."
- **Visible en:** Catálogo, comprobante PDF, enlace de compartir

---

## 2. Usuarios y Actores

### Comprador (Público)
- **Autenticación:** NO REQUERIDA
- **Datos capturados:** Solo nombre, teléfono, notas opcionales (para el pedido)
- **Sin registro:** No se crea cuenta, solo se registra el pedido
- **Acceso:** Catálogo público, carrito (localStorage), checkout

### Propietario (Admin)
- **Autenticación:** Requerida (JWT con token de 24h)
- **Rol:** Único administrador (no hay multiusuario)
- **Acceso:** Panel administrativo completo
- **Operaciones:** Gestión de productos, pedidos, categorías, configuración

---

## 3. Flujo de Compra Detallado

### Paso 1: Acceso al catálogo
- **URL:** `/` (raíz de la aplicación)
- **Contenido mostrado:**
  - Logo de Popé
  - Horarios de atención
  - Categorías de productos
  - Productos disponibles
  - Búsqueda
  - Carrito (acceso rápido)
- **Filtrado:** Solo productos activos en categorías activas
- **Disponibilidad:** Mostrar DISPONIBLE o AGOTADO
- **Acciones:** Agregar al carrito, ver detalles, buscar

### Paso 2: Gestión del carrito
- **Almacenamiento:** localStorage (sin servidor)
- **Contenido:**
  ```json
  {
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "name": "Jabón líquido 5L",
        "price": 450.00,
        "snapshot_at": "2026-11-05T10:30:00Z"
      }
    ]
  }
  ```
- **Operaciones:** Agregar, modificar cantidad, eliminar, vaciar
- **Validación:** Cantidad > 0, producto disponible
- **Persistencia:** Hasta completar pedido o limpiar localStorage

### Paso 3: Checkout
- **Ruta:** `/checkout`
- **Formulario requerido:**
  - Nombre del comprador (texto, max 100 caracteres)
  - Teléfono (texto, max 20 caracteres)
  - Notas opcionales (textarea, max 500 caracteres)
- **Resumen:** Total estimado, desglose por item
- **Botón:** Confirmar pedido
- **Validación:** Frontend (nombres no vacíos, teléfono no vacío, carrito no vacío)

### Paso 4: Creación del pedido (POST /api/v1/orders/)
**Datos enviados:**
```json
{
  "customer_name": "Juan Pérez",
  "customer_phone": "+54 9 376 123-4567",
  "notes": "Entregar entre 14 y 16hs",
  "items": [
    {"product_id": 1, "quantity": 2}
  ]
}
```

**Validaciones backend (CRÍTICO):**
- ✓ Todos los campos requeridos presentes
- ✓ Carrito no vacío
- ✓ Cada producto existe y está activo
- ✓ Cada producto está disponible (AVAILABLE)
- ✓ Cantidad válida (> 0)
- ✓ **Recalcular precios desde BD** (NO confiar en cliente)
- ✓ Calcular totales en DECIMAL(10,2)
- ✓ Usar transacción para crear order + items
- ✓ Generar order_number único

**Respuesta exitosa (201):**
```json
{
  "order_id": 1,
  "order_number": "POP-20261105-001",
  "subtotal": 900.00,
  "total": 900.00,
  "created_at": "2026-11-05T10:35:00Z",
  "status": "PENDIENTE",
  "pdf_url": "/api/v1/orders/POP-20261105-001/pdf/",
  "whatsapp_message": "Hola, quiero consultar por el pedido #POP-20261105-001...",
  "whatsapp_link": "https://wa.me/543764710683?text=..."
}
```

### Paso 5: Confirmación del comprador
- **Ruta:** `/order-confirmation/[order_number]`
- **Mostrar:**
  - Número de pedido (destacado)
  - Resumen de items y total
  - Botón "Descargar PDF"
  - Botón "Abrir WhatsApp"
  - Leyenda: "Solicitud de pedido pendiente de confirmación comercial"
- **Acciones:** El comprador abre WhatsApp manualmente (no es automático)
- **Post-compra:** Limpiar localStorage

### Nota importante sobre WhatsApp
- El comprador abre WhatsApp manualmente desde el botón
- **No se puede adjuntar automáticamente el PDF** desde el navegador
- El sistema prepara el enlace pero el usuario controla la acción
- El pedido permanece PENDIENTE hasta que el propietario lo confirma

---

## 4. Estados del Pedido

### Estados implementados
- **PENDIENTE:** Pedido creado, esperando confirmación del propietario
- **CONFIRMADO:** Propietario confirmó el pedido
- **CANCELADO:** Pedido cancelado (por comprador o propietario)

### Transiciones permitidas
```
PENDIENTE  → CONFIRMADO  (propietario confirma)
PENDIENTE  → CANCELADO   (propietario cancela)
CONFIRMADO → CANCELADO   (propietario cancela)
```

### Restricciones
- No reactivar pedidos cancelados
- No eliminar pedidos (conservar historial)
- Registrar fecha y responsable de cada cambio

---

## 5. Gestión del Catálogo

### Productos

**Campos:**
- ID (auto)
- Nombre (max 150 caracteres)
- Descripción (opcional, max 1000 caracteres)
- Precio (DECIMAL, requerido, > 0)
- Imagen (archivo)
- Categoría (referencia, requerido)
- Disponibilidad (AVAILABLE o SOLD_OUT, binaria)
- Activo (boolean, default true)
- created_at, updated_at

**Reglas:**
- Mostrar solo productos activos
- Mostrar disponibilidad de cada producto
- No permitir comprar productos agotados (SOLD_OUT)
- Cambio de disponibilidad: binaria y rápida
- No mostrar productos inactivos en catálogo público
- Conservar históricos para pedidos ya realizados
- Permitir cambiar imagen desde celular

**CRUD:**
- Crear: POST /api/v1/admin/products/
- Leer: GET /api/v1/admin/products/
- Actualizar: PATCH /api/v1/admin/products/<id>/
- Desactivar: DELETE /api/v1/admin/products/<id>/ (marca is_active=false)

### Categorías

**Campos:**
- ID (auto)
- Nombre (max 100, único)
- Descripción (opcional)
- Activa (boolean, default true)
- created_at, updated_at

**Reglas:**
- Una categoría puede tener varios productos
- Un producto pertenece a una categoría
- No eliminar categoría si tiene productos
- Permitir desactivar categoría
- Al desactivar, sus productos se ocultan del catálogo

**CRUD:**
- Crear: POST /api/v1/admin/categories/
- Leer: GET /api/v1/admin/categories/
- Actualizar: PATCH /api/v1/admin/categories/<id>/
- Desactivar: DELETE /api/v1/admin/categories/<id>/ (con validación)

---

## 6. Comprobante PDF

### Contenido obligatorio
- Nombre comercial: "Popé"
- Logo: Si existe en settings
- Fecha y hora del pedido
- Número de pedido (POP-20261105-001)
- Datos del comprador: Nombre, teléfono
- Tabla de items:
  - Producto, cantidad, precio unitario, subtotal
- **Total estimado**
- **Estado:** PENDIENTE
- **Leyenda legal:**
  ```
  "Solicitud de pedido pendiente de confirmación comercial.
  Este es un comprobante informativo, no una factura fiscal.
  El propietario confirmará esta operación mediante WhatsApp."
  ```
- Número de WhatsApp para contactar

### Características técnicas
- **Generador:** reportlab (Python)
- **Formato:** PDF
- **Nombre archivo:** `pedido_POP-20261105-001.pdf`
- **Tamaño página:** A4 vertical
- **Descargable:** GET /api/v1/orders/<order_number>/pdf/ (sin autenticación)
- **Compatible:** Móvil y desktop

---

## 7. Exportación XLSX

### Estructura del archivo
- **Una fila por item de pedido** (si pedido tiene 3 items = 3 filas)
- **Nombre archivo:** `pedidos_Popé_[fecha].xlsx`

### Columnas
1. Número de pedido
2. Fecha del pedido
3. Cliente (nombre)
4. Teléfono del cliente
5. Estado
6. Producto
7. Cantidad
8. Precio unitario
9. Subtotal del item
10. Total del pedido (repetido en cada fila)

### Filtros aplicables
- Rango de fechas (from/to)
- Estado (PENDIENTE, CONFIRMADO, CANCELADO)
- Búsqueda (optional)

### Endpoint
- GET /api/v1/admin/reports/orders/export/?format=xlsx&status=CONFIRMADO&date_from=2026-11-01&date_to=2026-11-30

---

## 8. Panel Administrativo

### Acceso
- **Autenticación:** JWT
- **Login:** /admin/login (username + password)
- **Sesión:** 24 horas con posibilidad de refresh
- **Mobile-first:** Diseño optimizado para celulares

### Dashboard
- KPIs: Pedidos pendientes, ventas hoy, semana, productos activos, agotados
- Última actividad
- Botones de acción rápida

### Gestión de Pedidos
- Listado con filtros (estado, fecha, búsqueda)
- Detalles completos
- Historial de cambios
- Acciones: Confirmar, cancelar, descargar PDF

### Gestión de Productos
- CRUD completo
- Carga de imágenes desde celular
- Switch rápido de disponibilidad
- Búsqueda y filtros

### Gestión de Categorías
- CRUD simple
- Validación: no eliminar si tiene productos

### Configuración
- Nombre comercial
- Logo
- Número WhatsApp
- Mensaje WhatsApp (editable)
- Horarios de atención (editable)
- Colores corporativos (opcional)

---

## 9. Restricciones de Alcance (MVP)

### NO implementar
- Pagos online
- Facturación electrónica
- Inventario por cantidades (solo disponible/agotado)
- Gestión de proveedores
- Compras y reposición
- Gestión de repartidores
- Seguimiento de entregas
- WhatsApp Business API
- Mensajes automáticos
- Registro de compradores
- Multi-empresa
- Múltiples administradores
- Suscripciones
- Aplicación nativa

---

## 10. Criterios de Aceptación

El MVP debe permitir:

1. ✓ Consultar catálogo públicamente
2. ✓ Buscar y filtrar productos
3. ✓ Agregar productos disponibles al carrito
4. ✓ Modificar cantidades
5. ✓ Generar pedidos
6. ✓ Validar precios y disponibilidad
7. ✓ Generar identificadores únicos
8. ✓ Generar comprobantes PDF
9. ✓ Preparar mensajes de WhatsApp
10. ✓ Administrar productos desde celular
11. ✓ Administrar categorías
12. ✓ Consultar pedidos
13. ✓ Confirmar pedidos
14. ✓ Cancelar pedidos
15. ✓ Descargar comprobantes
16. ✓ Exportar pedidos a XLSX
17. ✓ Mantener historial
18. ✓ Proteger panel administrativo

---

## Nota sobre Migración de Catálogo

El catálogo actual en Kyte (https://popeproductosdelimpieza.kyte.site/es) será **migrado manualmente**:

**Por qué no es automática:**
- Kyte es una SPA (Single Page Application) con datos cargados dinámicamente
- No expone una API pública para extraer datos
- No permite web scraping directo

**Procedimiento de migración:**
1. Propietario accede a Kyte y revisa el catálogo actual
2. Documenta productos, categorías, precios (puede exportar de Kyte si es posible)
3. Propietario carga productos en el nuevo panel admin
4. Backend valida integridad de datos
5. Se confirma que no hay duplicados ni datos corruptos

**Herramienta de importación:**
- Crearemos endpoint temporal para importar CSV si Kyte permite exportar
- O importación manual a través del panel admin
- O script de importación batch para lotes grandes

---

## Decisión Pendiente

**¿Puedes exportar el catálogo de Kyte?** Kyte Web tiene función de exportación de Productos Report. Si es posible, proporcioná ese archivo CSV/Excel para acelerar la migración.

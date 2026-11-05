# DESIGN - Tienda Online Popé

## 1. Identidad Visual

### Paleta de Colores Corporativos
Extraída del logo de Popé:

```css
:root {
  /* Colores corporativos */
  --color-primary: #FF4757;        /* Rojo coral - marca principal */
  --color-primary-dark: #E63946;
  --color-primary-light: #FF7B85;
  
  --color-secondary: #7DC41F;      /* Verde lima - limpieza */
  --color-secondary-dark: #6BA818;
  --color-secondary-light: #94D82D;
  
  --color-accent: #FF9D00;         /* Naranja - energía */
  --color-accent-dark: #E68700;
  
  --color-accent2: #0DC7D1;        /* Azul cian - confianza */
  
  /* Neutros */
  --color-dark: #2C3E50;           /* Gris oscuro */
  --color-text: #1F2937;
  --color-text-light: #6B7280;
  --color-bg: #FFFFFF;
  --color-bg-light: #F9FAFB;
  --color-border: #E5E7EB;
  
  /* Estados */
  --color-success: #7DC41F;        /* Verde (disponible, confirmado) */
  --color-warning: #FF9D00;        /* Naranja (pendiente) */
  --color-danger: #EF4444;         /* Rojo (agotado, cancelado) */
  --color-info: #0DC7D1;           /* Cian (información) */
}
```

### Tipografía

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

h1: 2.25rem (36px) - Bold
h2: 1.875rem (30px) - Bold
h3: 1.5rem (24px) - Semibold
h4: 1.25rem (20px) - Semibold
body: 1rem (16px) - Regular
small: 0.875rem (14px) - Regular
xs: 0.75rem (12px) - Regular
```

### Espaciado (Escala 4px)

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Iconografía
- Usar iconos de Heroicons o Material Design
- Tamaño: 24px para botones, 32px para header
- Color: Consistente con texto o accent según contexto

---

## 2. Componentes Reutilizables (Frontend)

### Atomos

**Button**
```
Props: variant (primary|secondary|danger), size (sm|md|lg), disabled, loading
Variantes:
- Primary: bg-primary, text-white
- Secondary: bg-gray-200, text-dark
- Danger: bg-danger, text-white
- Ghost: border-primary, text-primary
```

**Input / Textarea**
```
Props: label, placeholder, value, onChange, error, disabled, required
Estados: default, focus, error, disabled
Error: Mostrar mensaje en color danger
```

**Badge**
```
Props: variant (success|warning|danger|info), label
Variantes: Colores según estado
Uso: Estados de pedidos, disponibilidad
```

**Card**
```
Props: children, onClick, className
Estilos: Border, padding, shadow, rounded corners
```

**Modal**
```
Props: open, onClose, title, children, actions
Overlay: Semitransparente, cierra con ESC
Accesibilidad: Focus trap, ARIA
```

**Loading**
```
Spinner: Animación de rotación
Backdrop: Opcional
Mensaje: Opcional
```

**ProductCard**
```
Props: product, onAddCart, onViewDetails
Elementos:
- Imagen con placeholder
- Nombre
- Precio destacado
- Badge de disponibilidad
- Botón "Agregar al carrito"
- Botón "Detalles"
```

### Layouts

**Header**
```
Elementos:
- Logo (izquierda)
- Búsqueda (centro)
- Icono carrito (derecha, con contador)
- Hamburguesa (móvil)

Responsiveness:
- Desktop: Logo + búsqueda + carrito
- Mobile: Logo (comprimido) + hamburguesa
```

**Footer**
```
Elementos:
- Horarios de atención
- Número de WhatsApp
- Leyenda Kyte (si aplica)
- Links (about, etc.)
```

**AdminLayout**
```
Componentes:
- Sidebar (desktop) / Hamburguesa (móvil)
- Header con usuario + logout
- Contenido principal
- Responsive: Sidebar oculto en móvil por defecto
```

**OrderSummary**
```
Props: items, totals
Elementos:
- Tabla de items
- Subtotal
- Total destacado
```

---

## 3. Arquitectura de Información

### Catálogo Público

```
Ruta: /
┌─ Header
│  ├─ Logo Popé
│  ├─ Buscador (con autocomplete)
│  ├─ Carrito (badge)
│  └─ Horarios (expandible)
├─ Categorías (tabs horizontales)
├─ Grid de Productos
│  ├─ ProductCard
│  │  ├─ Imagen
│  │  ├─ Nombre
│  │  ├─ Precio
│  │  ├─ Disponibilidad (badge)
│  │  ├─ Botón "Agregar"
│  │  └─ Botón "Detalles"
│  └─ [Repetir por cada producto]
└─ Footer
   ├─ Horarios
   ├─ WhatsApp
   └─ Leyenda
```

**Mobile:** Grid de 2 columnas, cards compactas
**Desktop:** Grid de 3-4 columnas

### Detalles del Producto

```
Ruta: /product/<id>
┌─ Header (back button)
├─ Imagen grande
├─ Nombre
├─ Precio destacado
├─ Disponibilidad (badge)
├─ Descripción
├─ Selector de cantidad (+ -)
├─ Botón "Agregar al carrito" (ancho completo)
└─ Botón "Volver"
```

### Carrito

```
Ruta: /cart
┌─ Header: "Mi carrito"
├─ [Si vacío]
│  └─ Mensaje: "Tu carrito está vacío"
└─ [Si tiene items]
   ├─ Listado de items
   │  ├─ Producto
   │  ├─ Cantidad (controles + -)
   │  ├─ Precio unitario
   │  ├─ Subtotal
   │  └─ Botón eliminar (X)
   ├─ Divider
   ├─ Resumen
   │  ├─ Subtotal
   │  └─ Total (destacado)
   └─ Botones
      ├─ "Ir a checkout" (primary)
      └─ "Continuar comprando" (secondary)
```

### Checkout

```
Ruta: /checkout
┌─ Header: "Completar pedido"
├─ Resumen visual (items + total)
├─ Formulario
│  ├─ Nombre (requerido)
│  ├─ Teléfono (requerido)
│  ├─ Notas (opcional)
│  └─ Checkbox: Acepto términos
├─ Botones
│  ├─ "Confirmar pedido" (primary, ancho completo)
│  └─ "Editar carrito" (secondary)
└─ Loader mientras se procesa
```

### Confirmación de Pedido

```
Ruta: /order-confirmation/<order_number>
┌─ Icono de éxito
├─ "¡Pedido generado exitosamente!"
├─ Número de pedido (destacado, XL)
├─ Resumen de items
├─ Total
├─ Leyenda:
│  "Solicitud de pedido pendiente de
│   confirmación comercial"
├─ Botones
│  ├─ "Descargar PDF" (primary)
│  └─ "Abrir WhatsApp" (secondary, con icono)
└─ "Volver al catálogo" (link)
```

### Admin - Login

```
Ruta: /admin/login
┌─ Centrado
├─ Logo Popé (grande)
├─ Formulario
│  ├─ Username
│  ├─ Contraseña
│  └─ Botón "Ingresar" (primary, ancho completo)
├─ [Error message si aplica]
└─ Link: "¿Olvidaste tu contraseña?" (ocultar en MVP)
```

### Admin - Dashboard

```
Ruta: /admin/dashboard
┌─ Header
│  ├─ Logo Popé
│  ├─ "Bienvenido, [usuario]"
│  └─ Botón "Salir"
├─ Sidebar / Hamburguesa (móvil)
│  ├─ Dashboard (active)
│  ├─ Pedidos
│  ├─ Productos
│  ├─ Categorías
│  ├─ Reportes
│  └─ Configuración
└─ Contenido
   ├─ KPIs (4 cards)
   │  ├─ Pedidos pendientes
   │  ├─ Ventas hoy
   │  ├─ Ventas semana
   │  └─ Productos activos
   ├─ Últimos pedidos (tabla mini)
   ├─ Botones de acción rápida
   │  ├─ "+ Nuevo producto"
   │  ├─ "+ Nueva categoría"
   │  └─ "Ver pedidos pendientes"
   └─ [Gráficos opcionales]
```

### Admin - Pedidos

```
Ruta: /admin/orders
┌─ Header: "Pedidos"
├─ Filtros (fila)
│  ├─ Estado (select)
│  ├─ Fecha desde (date)
│  ├─ Fecha hasta (date)
│  ├─ Búsqueda (text)
│  └─ Botón "Filtrar" / "Limpiar"
├─ Tabla responsive
│  ├─ Número pedido
│  ├─ Cliente
│  ├─ Total
│  ├─ Estado (badge con color)
│  ├─ Fecha
│  └─ Acciones (ver, confirmar, cancelar)
├─ Paginación
└─ Botón "Descargar reporte"
```

### Admin - Detalles de Pedido

```
Ruta: /admin/orders/<id>
┌─ Header: "Pedido #POP-20261105-001"
├─ Info general (2 cols)
│  ├─ Número de pedido
│  ├─ Fecha/Hora
│  ├─ Cliente (nombre)
│  ├─ Teléfono
│  ├─ Estado (badge grande)
│  └─ Notas (si las hay)
├─ Tabla de items
│  ├─ Producto | Cantidad | Precio | Subtotal
│  └─ [Repetir por cada item]
├─ Total (destacado)
├─ Historial de cambios (timeline)
│  ├─ "Pedido creado - 2026-11-05 10:35"
│  ├─ "Confirmado por [usuario] - 2026-11-05 10:40"
│  └─ [eventos]
├─ Botones
│  ├─ "Descargar PDF"
│  ├─ "Confirmar" (si está PENDIENTE)
│  ├─ "Cancelar" (con modal de confirmación)
│  └─ "Volver"
└─ [Modal de confirmación si necesario]
```

### Admin - Productos

```
Ruta: /admin/products
┌─ Header: "Productos"
├─ Filtros
│  ├─ Categoría (select)
│  ├─ Búsqueda (text)
│  └─ Activos/Inactivos (toggle)
├─ Botón "+ Nuevo producto" (primary, sticky)
├─ Tabla responsive
│  ├─ Imagen (thumbnail 50x50)
│  ├─ Nombre
│  ├─ Precio
│  ├─ Disponibilidad (switch inline)
│  ├─ Activo (switch inline)
│  └─ Acciones (editar, eliminar)
├─ Paginación
└─ [Loader mientras carga]
```

### Admin - Formulario de Producto

```
Ruta: /admin/products/new
Ruta: /admin/products/edit/<id>
┌─ Header: "Nuevo producto" / "Editar producto"
├─ Formulario
│  ├─ Nombre (requerido)
│  ├─ Descripción (optional)
│  ├─ Precio (requerido)
│  ├─ Categoría (select, requerido)
│  ├─ Imagen (file upload, con preview)
│  │  ├─ Preview actual (si existe)
│  │  ├─ Botón "Cambiar imagen"
│  │  └─ Botón "Eliminar imagen" (si existe)
│  ├─ Disponibilidad (radio: AVAILABLE / SOLD_OUT)
│  ├─ Activo (checkbox)
│  └─ Botones
│     ├─ "Guardar" (primary)
│     ├─ "Guardar y crear otro" (secondary)
│     ├─ "Cancelar" (ghost)
│     └─ "Eliminar" (danger, solo si existe)
└─ [Validaciones y mensajes de error]
```

### Admin - Categorías

```
Ruta: /admin/categories
┌─ Header: "Categorías"
├─ Botón "+ Nueva categoría" (primary)
├─ Tabla simple
│  ├─ Nombre
│  ├─ Descripción
│  ├─ Productos (contador)
│  ├─ Activa (switch)
│  └─ Acciones (editar, eliminar)
├─ [Modal para crear/editar]
│  ├─ Nombre (requerido)
│  ├─ Descripción (optional)
│  ├─ Activa (checkbox)
│  └─ Botones: Guardar, Cancelar
└─ [Validación: no eliminar si tiene productos]
```

### Admin - Reportes

```
Ruta: /admin/reports
┌─ Header: "Reportes"
├─ Filtros
│  ├─ Fecha desde (date)
│  ├─ Fecha hasta (date)
│  ├─ Estado (multiselect)
│  └─ Botón "Descargar XLSX"
├─ Preview (tabla de datos)
│  └─ [Mostrar primeras 10 filas]
└─ [Loader mientras descarga]
```

### Admin - Configuración

```
Ruta: /admin/settings
┌─ Header: "Configuración"
├─ Sección: Identidad
│  ├─ Nombre comercial (text)
│  ├─ Logo (file upload, con preview)
│  └─ Botón "Guardar"
├─ Sección: Contacto
│  ├─ Número WhatsApp (text)
│  ├─ Mensaje WhatsApp (textarea)
│  └─ Botón "Guardar"
├─ Sección: Horarios
│  ├─ [Editar por día de la semana]
│  │  ├─ Día: Lunes
│  │  ├─ Cerrado (checkbox)
│  │  ├─ Desde (time) / Hasta (time)
│  │  └─ [Repetir para cada día]
│  └─ Botón "Guardar"
├─ Sección: Colores (opcional en MVP)
│  ├─ Color primario (color picker)
│  ├─ Color secundario (color picker)
│  └─ [Preview en tiempo real]
└─ [Mensajes de éxito/error]
```

---

## 4. Responsiveness

### Breakpoints

```
Mobile:    max-width: 640px
Tablet:    640px < width < 1024px
Desktop:   width > 1024px
```

### Estrategia Mobile-First

**Catálogo Público:**
- Grid 2 cols en móvil, 3-4 en desktop
- Botones full-width en formularios
- Tabs horizontales scrollables en móvil

**Panel Admin:**
- Sidebar oculto por defecto (hamburguesa)
- Tablas horizontales scrollables en móvil
- Switches en lugar de checkboxes
- Formularios column-based

---

## 5. Accesibilidad (WCAG 2.1 AA)

### Estándares

- **Contraste:** Mínimo 4.5:1 para texto
- **Tamaño de fuente:** Mínimo 16px para input
- **Touch targets:** Mínimo 44x44px para botones
- **Labels:** Explícitas en todos los inputs
- **ARIA:** Roles, labels, descriptions donde sea necesario
- **Teclado:** Navegación completa sin ratón
- **Focus:** Visible en todos los elementos interactivos
- **Alt text:** En todas las imágenes

### Elementos críticos

```
- Inputs: <label htmlFor="...">
- Buttons: aria-label si no hay texto
- Images: alt text descriptivo
- Icons: aria-label o title
- Modal: focus trap, ESC para cerrar
- Tablas: <thead>, <tbody>, scope en headers
```

---

## 6. Performance

### Optimizaciones

- **Imágenes:** Compresión automática a 800x600px max, WebP si soporta
- **Bundle:** Lazy load de rutas (React.lazy)
- **CSS:** Minificado, variable scoping
- **Fonts:** System fonts (no custom = 0 requests)
- **Caching:** Service Worker para assets estáticos
- **API:** Debounce en búsqueda, paginación en tablas

### Lighthouse Target

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90

---

## 7. Temas y Variaciones

### Tema predeterminado

- Colores: Paleta Popé (rojo coral primario)
- Font: System stack
- Mode: Light (sin dark mode en MVP)

### Personalización futura

- Custom logo
- Custom colores
- Dark mode (post-MVP)
- Temas regionales (post-MVP)

---

## 8. Estados y Transiciones

### Estados UI

```
Default → Hover → Active → Disabled/Loading
```

### Transiciones

- Duración: 200ms
- Easing: ease-in-out
- Efectos: Fade, slide, scale (sutiles)

### Mensajes

- Success: Notification verde, auto-close en 3s
- Error: Notification roja, requiere close
- Warning: Notification naranja
- Info: Notification azul

---

## Nota de Implementación

Estos diseños priorizan **experiencia móvil**, especialmente para el propietario que opera desde su celular. No se replica interfaz de escritorio en móvil, sino se adapta inteligentemente.

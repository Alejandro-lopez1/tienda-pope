# Proyecto: Tienda online con gestión de pedidos

## 1. Contexto del proyecto

Desarrollar una tienda online para un comercio independiente de productos de limpieza.

El comercio no tiene local físico.

Actualmente utiliza una plataforma de catálogo online y WhatsApp para concretar ventas.

El propietario no dispone de computadora. Administra el negocio desde su celular.

El objetivo es reemplazar la experiencia actual por una solución propia.

La solución debe ofrecer una interfaz comercial clara y una administración móvil sencilla.

El sistema debe registrar los pedidos y generar comprobantes PDF.

También debe permitir exportar las operaciones a Excel.

## 2. Objetivo del MVP

Construir una aplicación web responsive con dos interfaces:

1. Catálogo público para compradores.
2. Panel administrativo para el propietario.

El comprador consulta productos, arma un carrito y genera un pedido.

El sistema registra el pedido y genera un comprobante PDF.

El comprador continúa la operación mediante WhatsApp.

El propietario revisa y confirma la operación.

El propietario administra productos y consulta reportes desde su celular.

## 3. Decisiones funcionales confirmadas

- Catálogo público sin autenticación.
- Un único propietario administrador.
- Administración desde dispositivos móviles.
- Productos organizados por categorías.
- Carrito de compras.
- Pedidos enviados mediante WhatsApp.
- Comprobante PDF por pedido.
- Confirmación manual por el propietario.
- Disponibilidad binaria: DISPONIBLE / AGOTADO.
- Entregas coordinadas manualmente por WhatsApp.
- Exportación de pedidos a XLSX.
- Sin pagos online.
- Sin inventario por cantidades.
- Sin integración con WhatsApp Business API.

## 4. Actores

### Comprador

Puede:

- Consultar el catálogo.
- Buscar productos.
- Filtrar por categoría.
- Consultar precios y descripciones.
- Agregar productos al carrito.
- Modificar cantidades.
- Eliminar productos.
- Completar sus datos.
- Generar un pedido.
- Descargar su comprobante PDF.
- Continuar mediante WhatsApp.

No necesita registrarse.

### Propietario

Puede:

- Iniciar y cerrar sesión.
- Consultar indicadores del negocio.
- Crear productos.
- Editar productos.
- Desactivar productos.
- Modificar precios.
- Cargar imágenes desde el celular.
- Crear y administrar categorías.
- Modificar disponibilidad.
- Consultar pedidos.
- Filtrar pedidos.
- Consultar detalles.
- Descargar comprobantes PDF.
- Confirmar pedidos.
- Cancelar pedidos.
- Exportar operaciones a XLSX.

## 5. Flujo de compra

Implementar este flujo:

1. El comprador ingresa al catálogo.
2. Selecciona productos disponibles.
3. Modifica las cantidades.
4. Consulta el total estimado.
5. Completa nombre y teléfono.
6. Agrega observaciones opcionales.
7. Confirma la generación del pedido.
8. El backend valida los productos.
9. El backend obtiene los precios vigentes.
10. El backend calcula los importes.
11. El backend registra el pedido.
12. El backend genera un identificador único.
13. El backend genera el comprobante PDF.
14. El frontend permite descargar el PDF.
15. El frontend prepara un mensaje para WhatsApp.
16. El comprador abre WhatsApp y adjunta el PDF.

IMPORTANTE:

El navegador no puede adjuntar automáticamente un PDF mediante un enlace convencional de WhatsApp.

No afirmar que el mensaje fue enviado ni que el archivo fue recibido.

El pedido queda PENDIENTE hasta la validación del propietario.

## 6. Estados del pedido

Implementar:

- PENDIENTE
- CONFIRMADO
- CANCELADO

Transiciones permitidas:

- PENDIENTE → CONFIRMADO
- PENDIENTE → CANCELADO
- CONFIRMADO → CANCELADO

No permitir reactivar pedidos cancelados.

No eliminar pedidos físicamente.

Registrar fecha y responsable de cada cambio.

## 7. Gestión del catálogo

### Producto

Campos:

- id
- name
- description
- price
- image
- category_id
- availability
- is_active
- created_at
- updated_at

Reglas:

- Mostrar productos activos.
- Mostrar productos disponibles.
- Identificar productos agotados.
- No permitir comprar productos agotados.
- No mostrar productos inactivos.
- Conservar productos vinculados a pedidos históricos.
- Permitir modificar imágenes desde el celular.

### Categoría

Campos:

- id
- name
- description opcional
- is_active
- created_at
- updated_at

Reglas:

- Una categoría puede contener varios productos.
- Un producto pertenece a una categoría.
- No eliminar categorías con productos asociados.
- Permitir desactivar categorías.

## 8. Modelo de pedidos

### Order

Campos sugeridos:

- id
- order_number
- customer_name
- customer_phone
- notes
- status
- subtotal
- total
- created_at
- updated_at
- confirmed_at
- cancelled_at

### OrderItem

Campos sugeridos:

- id
- order_id
- product_id
- product_name_snapshot
- unit_price_snapshot
- quantity
- subtotal

IMPORTANTE:

Guardar nombre y precio históricos de cada producto.

Los cambios posteriores del catálogo no deben modificar pedidos existentes.

Calcular todos los importes en backend.

Usar tipos decimales para importes monetarios.

No utilizar números de punto flotante para cálculos monetarios.

## 9. Comprobante PDF

Generar un comprobante por pedido.

Incluir:

- Nombre comercial.
- Logotipo, si existe.
- Número de pedido.
- Fecha y hora.
- Nombre del comprador.
- Teléfono.
- Productos.
- Cantidades.
- Precios unitarios.
- Subtotales.
- Total estimado.
- Estado del pedido.

Incluir la leyenda:

"Solicitud de pedido pendiente de confirmación comercial".

No presentar el documento como factura fiscal.

No presentarlo como comprobante de pago.

Permitir descargar y compartir el archivo desde dispositivos móviles.

## 10. Exportaciones

Implementar exportación XLSX.

Permitir filtros por:

- Fecha inicial.
- Fecha final.
- Estado.

Usar una fila por producto del pedido.

Columnas:

- Número de pedido.
- Fecha.
- Cliente.
- Teléfono.
- Estado.
- Producto.
- Cantidad.
- Precio unitario.
- Subtotal.
- Total del pedido.

Repetir los datos generales del pedido por cada producto.

Implementar CSV como alternativa.

La exportación debe respetar los filtros seleccionados.

## 11. Requisitos de interfaz

### Catálogo público

Diseñar una interfaz comercial moderna.

Priorizar:

- Navegación sencilla.
- Productos visualmente identificables.
- Fotografías optimizadas.
- Precios visibles.
- Categorías accesibles.
- Botones de compra claros.
- Carrito accesible.
- Diseño responsive.

### Panel administrativo

Diseñar primero para celulares.

Priorizar:

- Botones táctiles grandes.
- Formularios cortos.
- Navegación sencilla.
- Acceso rápido a pedidos pendientes.
- Edición de productos.
- Carga de imágenes desde cámara o galería.
- Descargas accesibles.
- Tablas adaptadas a pantallas pequeñas.

No reproducir interfaces administrativas de escritorio en pantallas móviles.

## 12. Arquitectura propuesta

Utilizar una arquitectura monolítica modular.

Tecnologías propuestas:

- Frontend: React + TypeScript.
- Backend: Django REST Framework.
- Base de datos: PostgreSQL.
- Comunicación: API REST.
- Aplicación: PWA.
- Contenedores: Docker Compose.
- Documentación: OpenAPI/Swagger.

Módulos sugeridos:

- authentication
- categories
- products
- orders
- reports

No implementar microservicios.

No incorporar infraestructura innecesaria.

Mantener separación entre presentación, lógica de negocio y persistencia.

## 13. Reglas técnicas

- Validar entradas en frontend y backend.
- No confiar en precios enviados por el cliente.
- Calcular importes en backend.
- Utilizar transacciones para crear pedidos.
- Evitar pedidos duplicados por reintentos.
- Proteger endpoints administrativos.
- Utilizar HTTPS en producción.
- Configurar variables de entorno.
- No guardar secretos en el repositorio.
- Optimizar imágenes.
- Implementar paginación cuando corresponda.
- Conservar registros históricos.
- Documentar endpoints.
- Incorporar pruebas automatizadas.

La disponibilidad es binaria.

No implementar descuentos de stock por cantidades.

Validar nuevamente la disponibilidad al crear cada pedido.

## 14. Requisitos PWA

Implementar:

- Web app manifest.
- Iconos.
- Instalación en dispositivos compatibles.
- Diseño responsive.
- Service worker.
- Caché de recursos estáticos.

No garantizar compras offline.

La creación de pedidos requiere conexión con el backend.

## 15. Seguridad

- Autenticación administrativa.
- Autorización en backend.
- Contraseñas almacenadas mediante hash seguro.
- Validación de archivos e imágenes.
- Restricción de formatos y tamaños.
- Protección de endpoints.
- Configuración CORS.
- Variables de entorno.
- HTTPS.

No exponer información administrativa en endpoints públicos.

## 16. Fuera del alcance

No implementar:

- Pagos online.
- Facturación electrónica.
- Inventario por cantidades.
- Gestión de proveedores.
- Compras y reposición.
- Gestión de repartidores.
- Seguimiento de entregas.
- WhatsApp Business API.
- Mensajes automáticos.
- Registro de compradores.
- Multiempresa.
- Múltiples administradores.
- Suscripciones.
- Aplicación nativa.

## 17. Criterios de aceptación

El MVP debe permitir:

1. Consultar el catálogo públicamente.
2. Buscar y filtrar productos.
3. Agregar productos disponibles al carrito.
4. Modificar cantidades.
5. Generar pedidos.
6. Validar precios y disponibilidad.
7. Generar identificadores únicos.
8. Generar comprobantes PDF.
9. Preparar mensajes de WhatsApp.
10. Administrar productos desde celulares.
11. Administrar categorías.
12. Consultar pedidos.
13. Confirmar pedidos.
14. Cancelar pedidos.
15. Descargar comprobantes.
16. Exportar pedidos a XLSX.
17. Mantener historial.
18. Proteger el panel administrativo.

## 18. Instrucciones de trabajo para Kiro

Trabajá bajo metodología Spec-Driven Development.

### Primera etapa: inspección

Antes de modificar archivos:

1. Inspeccioná el repositorio.
2. Identificá tecnologías existentes.
3. Revisá la estructura actual.
4. Identificá implementaciones reutilizables.
5. Compará el repositorio con esta especificación.
6. Detectá contradicciones y decisiones pendientes.

Presentá un informe con:

- Estado actual.
- Arquitectura propuesta.
- Diferencias detectadas.
- Riesgos técnicos.
- Decisiones pendientes.
- Plan incremental.

Esperá aprobación antes de implementar.

### Segunda etapa: especificación técnica

Prepará:

- Arquitectura detallada.
- Modelo de datos.
- Relaciones.
- Endpoints.
- Historias de usuario.
- Criterios de aceptación.
- Estrategia de pruebas.

No inventes información comercial.

Marcá explícitamente cualquier supuesto.

### Tercera etapa: implementación

Implementá por módulos.

Orden recomendado:

1. Estructura y configuración.
2. Base de datos y migraciones.
3. Autenticación.
4. Categorías y productos.
5. Catálogo público.
6. Carrito.
7. Creación de pedidos.
8. Generación PDF.
9. Integración mediante enlace de WhatsApp.
10. Panel administrativo.
11. Exportaciones.
12. PWA.
13. Pruebas y despliegue.

Ejecutá pruebas después de cada módulo.

No avances si existen errores críticos.

### Reglas generales

- Evitá sobreingeniería.
- No agregues funciones fuera del MVP.
- Priorizá la experiencia móvil.
- No dupliques lógica de negocio.
- No confíes en validaciones exclusivamente frontend.
- Mantené código legible.
- Documentá decisiones relevantes.
- Utilizá nombres consistentes.
- No inventes credenciales.
- No publiques secretos.
- No elimines datos existentes sin autorización.
- Consultá antes de introducir dependencias importantes.

Al finalizar cada etapa, informá:

- Archivos modificados.
- Funcionalidades implementadas.
- Pruebas ejecutadas.
- Resultados.
- Problemas pendientes.
- Próximo paso propuesto.

**No implementes todo en una única operación.**
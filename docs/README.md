# Documentación - Tienda Online Popé

## Archivos de Especificación Técnica

Esta carpeta contiene toda la documentación técnica para el desarrollo de la tienda online Popé.

### 📋 Documentos

1. **[01-REQUIREMENTS.md](01-REQUIREMENTS.md)**
   - Identidad comercial (Popé, colores, WhatsApp)
   - Usuarios y actores
   - Flujo de compra detallado
   - Estados de pedido
   - Gestión de catálogo
   - Comprobante PDF
   - Exportación XLSX
   - Panel administrativo
   - Criterios de aceptación

2. **[02-DESIGN.md](02-DESIGN.md)**
   - Paleta de colores corporativos (extraída del logo)
   - Tipografía y espaciado
   - Componentes reutilizables
   - Arquitectura de información (rutas y layouts)
   - Responsiveness y breakpoints
   - Accesibilidad WCAG 2.1 AA
   - Performance y PWA

3. **[03-TASKS.md](03-TASKS.md)**
   - 48 tareas concretas
   - Distribuidas en 8 fases (6-8 semanas)
   - Fase 1: Fundaciones (Docker, Django, React, autenticación)
   - Fase 2: Catálogo (endpoints, UI)
   - Fase 3: Carrito y Pedidos
   - Fase 4: PDF y WhatsApp
   - Fase 5: Panel Admin
   - Fase 6: Reportes (XLSX)
   - Fase 7: PWA (instalación)
   - Fase 8: Testing y Deploy

4. **[04-HOSTING_Y_RESUMEN.md](04-HOSTING_Y_RESUMEN.md)**
   - Opciones de hosting (Railway recomendado)
   - Procedimiento de migración de catálogo Kyte
   - Evitar sobreingeniería
   - Riesgos y mitigaciones
   - Timeline estimado
   - Checklist previo a implementación

### ✅ Estado de Decisiones

| Decisión | Estado |
|----------|--------|
| Logo | ✅ Encontrado (logo_pope.jpg) |
| Colores | ✅ Extraída paleta corporativa |
| Nombre comercial | ✅ Popé |
| WhatsApp | ✅ +54 9 376 471-0683 |
| Mensaje WhatsApp | ✅ Preformateado |
| Horarios | ⏳ Configurables desde admin |
| Catálogo existente | ⏳ Migración manual desde Kyte |
| Hosting | ⏳ Railway recomendado |

### 🎯 Resumen Ejecutivo

- **MVP Completo:** Todas las 18 funcionalidades especificadas
- **Alcance Verificado:** Sin sobreingeniería
- **Mobile-First:** Panel admin optimizado para celulares
- **Seguridad:** Validación dual, JWT, hashing seguro
- **Timeline:** 6-8 semanas
- **Stack:** Django + React + PostgreSQL (simple y mantenible)

### 🚀 Próximos Pasos

1. Revisar y aprobar documentación
2. Confirmar decisiones pendientes (hosting, Kyte)
3. Comenzar Fase 1: Fundaciones
4. Implementación incremental con verificación después de cada módulo

---

**Última actualización:** 5 de noviembre de 2026
**Versión:** 1.0 - MVP Especificaciones Completas

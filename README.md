# Tienda Online Popé

Plataforma de e-commerce para comercio independiente de productos de limpieza, con catálogo público, carrito de compras, generación de comprobantes PDF y panel administrativo móvil.

## 🎯 Objetivo

Reemplazar la actual plataforma Kyte con una solución propia que ofrezca:
- Interfaz comercial clara para compradores
- Administración completa desde dispositivos móviles
- Generación de comprobantes PDF
- Exportación de operaciones a Excel

## 🌍 Ubicación de Servicio

- Posadas
- Garupá
- Candelaria

## 📱 Características Principales

### Catálogo Público
- Consultar productos sin autenticación
- Buscar y filtrar por categoría
- Carrito de compras con localStorage
- Checkout simplificado
- Generación de comprobante PDF
- Enlace directo a WhatsApp

### Panel Administrativo (Mobile-First)
- Login seguro con JWT
- Gestión completa de productos
- Gestión de categorías
- Consulta y confirmación de pedidos
- Exportación de operaciones a XLSX
- Configuración de contacto y horarios

## 🛠 Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Axios (HTTP client)
- PWA (instalable en móvil)

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL 15
- JWT para autenticación
- Reportlab para generación de PDF
- Openpyxl para exportación XLSX

### DevOps
- Docker Compose
- Railway (hosting recomendado)

## 📋 Documentación

Toda la documentación técnica está en la carpeta `docs/`:

- **[docs/01-REQUIREMENTS.md](docs/01-REQUIREMENTS.md)** - Requerimientos funcionales completos
- **[docs/02-DESIGN.md](docs/02-DESIGN.md)** - Diseño visual y arquitectura de información
- **[docs/03-TASKS.md](docs/03-TASKS.md)** - Plan de implementación (48 tareas en 8 fases)
- **[docs/04-HOSTING_Y_RESUMEN.md](docs/04-HOSTING_Y_RESUMEN.md)** - Recomendaciones de hosting

## 🚀 Inicio Rápido

### Requisitos Previos
- Python 3.11+
- Node.js 18+
- Docker y Docker Compose
- Git

### Setup Local

```bash
# Clonar repositorio
git clone https://github.com/Alejandro-lopez1/tienda-pope.git
cd tienda-pope

# Cambiar a rama develop
git checkout develop

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### Con Docker Compose

```bash
docker-compose up -d
```

Acceder a:
- Catálogo: http://localhost:5173
- Admin: http://localhost:5173/admin/login
- API Docs: http://localhost:8000/api/schema/swagger/

## 📊 Estructura del Proyecto

```
tienda-pope/
├── README.md                    # Este archivo
├── docker-compose.yml           # Configuración Docker
├── .env.example                 # Variables de entorno
├── .gitignore                   # Archivos ignorados por Git
│
├── docs/                        # Documentación técnica
│   ├── 01-REQUIREMENTS.md
│   ├── 02-DESIGN.md
│   ├── 03-TASKS.md
│   └── 04-HOSTING_Y_RESUMEN.md
│
├── backend/                     # API Django REST
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── authentication/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── orders/
│   │   └── reports/
│   └── utils/
│       ├── pdf_generator.py
│       ├── xlsx_exporter.py
│       └── validators.py
│
└── frontend/                    # React + Vite
    ├── package.json
    ├── vite.config.ts
    ├── Dockerfile
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── context/
    └── public/
        ├── manifest.json
        └── icons/
```

## 🔄 Flujo de Git

### Rama `main`
- Código estable y listo para producción
- Solo PRs revisados y probados

### Rama `develop`
- Rama de desarrollo activo
- Base para feature branches
- Donde se integran nuevas funcionalidades

### Flujo Recomendado

```bash
# Crear feature branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# Trabajar en la rama
# ... hacer cambios ...
git add .
git commit -m "Descripción del cambio"
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub hacia develop
# Después de aprobar, mergear a develop
```

## 📅 Plan de Implementación

### Fase 1: Fundaciones (Semana 1)
- [ ] Estructura Docker
- [ ] Configuración Django
- [ ] Modelos de BD
- [ ] Autenticación JWT

### Fase 2: Catálogo (Semana 2)
- [ ] Endpoints de productos
- [ ] Catálogo público
- [ ] Búsqueda y filtros

### Fase 3: Carrito y Pedidos (Semana 2-3)
- [ ] Carrito con localStorage
- [ ] Checkout
- [ ] Creación de pedidos

### Fase 4: PDF y WhatsApp (Semana 3)
- [ ] Generador de PDF
- [ ] Enlaces de WhatsApp
- [ ] Confirmación de pedido

### Fase 5: Panel Admin (Semana 4)
- [ ] Dashboard
- [ ] Gestión de productos
- [ ] Gestión de pedidos

### Fase 6: Reportes (Semana 5)
- [ ] Exportación XLSX
- [ ] Filtros y búsqueda

### Fase 7: PWA (Semana 5)
- [ ] Web App Manifest
- [ ] Service Worker
- [ ] Instalación en móvil

### Fase 8: Testing (Semana 6)
- [ ] Tests backend
- [ ] Tests frontend
- [ ] Tests E2E

## 🔐 Seguridad

- Precios recalculados en backend
- JWT para autenticación admin
- Validación dual (frontend + backend)
- Hashing seguro de contraseñas (bcrypt)
- CORS configurado
- HTTPS en producción

## 📱 Paleta de Colores

Extraída del logo corporativo:

```
Primario:      #FF4757 (Rojo coral)
Secundario:    #7DC41F (Verde lima)
Acentos:       #FF9D00 (Naranja), #0DC7D1 (Azul cian)
Neutros:       #2C3E50 (Gris oscuro)
```

## 📞 Contacto

**WhatsApp:** +54 9 376 471-0683

## 📄 Licencia

Privado - Popé

## 🤝 Contribuciones

1. Clonar el repo
2. Crear feature branch desde `develop`
3. Hacer cambios y tests
4. Crear Pull Request
5. Esperar revisión

---

**Estado:** En desarrollo (Fase 1 en progreso)  
**Última actualización:** 5 de noviembre de 2026  
**Versión:** 0.1.0 - Especificaciones Completadas

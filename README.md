# Tienda Pope

E-commerce MVP para un comercio independiente de productos de limpieza (sin local físico). Catálogo público + panel administrativo mobile-first.

- **Zonas de entrega (referencia):** Posadas, Garupá, Candelaria
- **Stack:** Django + Django REST Framework (backend), React + TypeScript + Vite + Tailwind (frontend), PostgreSQL

## Regla de negocio (checkout)
El cliente arma el carrito y, al confirmar, proporciona **nombre, teléfono y dirección**. **No se solicita email.** Los clientes se identifican/agrupan por **teléfono normalizado**.

## Estructura
```text
backend/                 # API Django/DRF
  config/                # settings, urls, wsgi
  apps/
    auth/                # autenticación
    categories/          # categorías
    products/            # productos
    orders/              # pedidos, ítems, recibo PDF, WhatsApp
    customers/           # clientes derivados de pedidos (por teléfono) + exportación
frontend/                # React + Vite
docs/
  spec/PROJECT_SPEC.md   # especificación
  deploy/NETLIFY.md      # deploy frontend (Netlify) + backend separado
  history/               # fases/releases/ops archivados
```

## Ejecución local
### Requisitos
- Python 3.12+ (recomendado), Node.js 18+ (recomendado 20), Docker (opcional)

### Con Docker Compose
```bash
cp .env.example .env
docker compose up -d
```
- Frontend: http://localhost:5173
- API: http://localhost:8000

### Sin Docker
```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt
set DEBUG=True
python manage.py migrate
python manage.py runserver

# Frontend (otra terminal)
cd frontend
npm install
# VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

## API (principales)
- `GET/POST /api/v1/categories/`, `/api/v1/products/`
- `POST /api/v1/orders/` (público, crea pedido)
- `GET /api/v1/orders/{id}/generate-pdf/`
- Admin (JWT + staff): `/api/v1/customers/`, `/api/v1/customers/summary/`, `/api/v1/customers/orders/?phone=`, `/api/v1/customers/export/?format=xlsx|csv`

## Exportación (clientes, maestro-detalle)
`GET /api/v1/customers/export/?format=xlsx|csv` (admin).  
- **Maestro:** cliente (teléfono, nombre, dirección, métricas).
- **Detalle:** filas por ítem de pedido (pedido + producto/cantidad/importes), vinculadas al cliente. XLSX en una hoja “Clientes-Detalle”; CSV con BOM para Excel.

## Deploy
- **Frontend:** Netlify (ver `docs/deploy/NETLIFY.md`, `netlify.toml`). Variable: `VITE_API_URL=https://<backend>/api/v1`.
- **Backend:** host Python (Railway/Render/Fly, etc.) + Postgres. Configurar `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` para la URL del frontend.

## Documentación
- Especificación: `docs/spec/PROJECT_SPEC.md`
- Deploy: `docs/deploy/NETLIFY.md`
- Historial: `docs/history/`

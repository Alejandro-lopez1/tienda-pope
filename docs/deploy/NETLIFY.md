# Deploy: Frontend en Netlify + Backend aparte

## Resumen
- **Netlify**: solo para el **frontend** (SPA React/Vite, estático).
- **Backend Django/DRF**: desplegar en un host Python (Railway/Render/Fly.io) con PostgreSQL. Netlify no ejecuta este stack WSGI.

## Frontend (Netlify)
El repo incluye `netlify.toml` en la raíz:
- Base: `frontend`
- Build: `npm ci && npm run build`
- Publish: `dist`
- Fallback SPA: `frontend/public/_redirects` (`/* /index.html 200`) y redirect en `netlify.toml`.

### Variable de entorno (Netlify UI)
Configurar en el sitio de Netlify (build-time, Vite la incrusta):
- `VITE_API_URL=https://<TU-BACKEND>/api/v1`

Si cambia la URL del backend, volver a desplegar el frontend.

## Backend (producción)
Configurar variables de entorno en el host del backend:
- `DEBUG=False`
- `SECRET_KEY=<segura>`
- `ALLOWED_HOSTS=<dominio-backend>`
- `DATABASE_URL=<postgres>`
- `CORS_ALLOWED_ORIGINS=https://<tu-sitio>.netlify.app,http://localhost:5173`
- `CSRF_TRUSTED_ORIGINS=https://<tu-sitio>.netlify.app`
- R2 (opcional, recomendado para media): `USE_R2_STORAGE=True` + `R2_*` + `R2_PUBLIC_HOST`

## Local
- Backend: `python manage.py runserver` (o Docker) en `http://localhost:8000`
- Frontend: `npm run dev` con `VITE_API_URL=http://localhost:8000/api/v1`

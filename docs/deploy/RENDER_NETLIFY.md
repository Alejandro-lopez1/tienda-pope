# Deploy hoy: Render (backend) + Neon/Render Postgres + Netlify (frontend)

## Arquitectura
- **Frontend (SPA):** Netlify — `netlify.toml` (base `frontend`, `npm ci && npm run build`, publish `dist`). `VITE_API_URL` se incrusta en build.
- **Backend (Django/DRF):** Render Web Service (Python). Procfile raíz: `cd backend && python manage.py migrate && python manage.py collectstatic --noinput && gunicorn -c gunicorn_config.py config.wsgi`. `gunicorn_config.py` usa `0.0.0.0:$PORT`.
- **DB:** PostgreSQL gestionado vía `DATABASE_URL` (Neon recomendado o Render Postgres). **No usar SQLite en Render** (disco efímero → pérdida de datos).
- **Media:** en Render el disco es efímero; para imágenes hoy usar **R2** (`USE_R2_STORAGE=True` + vars `R2_*`).

## 1) Backend (Render)
1. Crear servicio (conecta repo). Confirmar que ejecuta el start/Procfile correcto.
2. Env vars:
   - `DEBUG=False`
   - `SECRET_KEY=<largo-aleatorio>`
   - `ALLOWED_HOSTS=<tu-servicio>.onrender.com`
   - `DATABASE_URL=<postgres://...?sslmode=require>` (Neon)
   - `CORS_ALLOWED_ORIGINS=https://<tu-sitio>.netlify.app`
   - `CSRF_TRUSTED_ORIGINS=https://<tu-sitio>.netlify.app`
   - `LOG_LEVEL=info`
   - `SECURE_SSL_REDIRECT=True`
   - (imágenes) `USE_R2_STORAGE=True`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_HOST`
3. Deploy y verificar `GET /health/`.
4. Crear admin: `python manage.py createsuperuser` (shell de Render / one-off job).

## 2) Frontend (Netlify)
1. Importar repo; `netlify.toml` define base/build/publish.
2. Env var (build-time): `VITE_API_URL=https://<tu-servicio>.onrender.com/api/v1`.
3. Deploy. Si cambia `VITE_API_URL`, redeploy.

## 3) Secuencia para obtener URLs sin retrabajo
1. Crear Render + Netlify (reservar URLs).
2. Configurar `VITE_API_URL` (Netlify) y `CORS/CSRF/ALLOWED_HOSTS` (Render) con las URLs reales.
3. Deploy backend → deploy frontend → smoke test.

## 4) Smoke tests
- `GET /health/` = 200.
- Catálogo carga sin errores CORS.
- Checkout crea pedido con **nombre, teléfono, dirección** (sin email) → confirmación muestra pedido, **PDF** y **WhatsApp**.
- Login admin (JWT, mismo sitio, `/admin/login`) → panel.
- Admin > Clientes (por teléfono) y **Exportar XLSX/CSV**.

## 5) Concurrencia / race condition (pedidos)
- El número de pedido se genera con entropía y la creación corre en `transaction.atomic()` con reintento ante colisión `IntegrityError` (`backend/apps/orders/utils.py`, `serializers.py`). Los ítems se validan (sin drops silenciosos).
- Prueba: emular pedidos simultáneos contra `POST /api/v1/orders/` y verificar 201, `order_number` únicos, sin 500.

Ejemplo rápido (ajustar `BASE`, `PRODUCT_ID` válido):
```bash
python - <<'PY'
import concurrent.futures, json, urllib.request
BASE='http://localhost:8000/api/v1'
PRODUCT_ID=1
def send(i):
    body=json.dumps({"customer_name":f"T{i}","customer_phone":f"376400{i:04d}","customer_address":"Calle 1","payment_method":"cash","items":[{"id":PRODUCT_ID,"quantity":1}]}).encode()
    req=urllib.request.Request(f"{BASE}/orders/",data=body,headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req) as r: return json.load(r)["order_number"]
with concurrent.futures.ThreadPoolExecutor(10) as ex:
    nums=list(ex.map(send, range(20)))
print(len(nums), len(set(nums)))
PY
```

## 6) Notas de seguridad
- `DEBUG=False` en prod; `SECRET_KEY` fuerte; CORS/CSRF limitados al dominio Netlify.
- Operaciones admin (listar/modificar pedidos, clientes/export) requieren staff. El flujo público post-compra (ver pedido, PDF, WhatsApp) permanece accesible para la confirmación.
- Browsable API de DRF solo en `DEBUG`. `mark_paid` solo staff.

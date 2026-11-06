# PRE-DEPLOYMENT CHECKLIST - Popé v0.8.0

**Date:** 2026-11-06  
**Status:** Ready for Render + Cloudflare Pages  
**Branch:** master (merged from fix/pre-deploy-critical)

---

## Code Verification ✅

All criteria verified locally (Python 3.12, Django 6.1.3, Pillow 11.0.0):

- ✅ `python manage.py check --deploy` → no issues (with R2 off and on)
- ✅ Without R2: `FileSystemStorage`
- ✅ With R2: `S3Storage`, URL `https://pub-<hash>.r2.dev/media/x.jpg` (no signature)
- ✅ With R2 active, WhiteNoise for staticfiles: `CompressedManifestStaticFilesStorage`
- ✅ Missing `R2_PUBLIC_HOST` with `USE_R2_STORAGE=True` → KeyError with variable name
- ✅ No `DEFAULT_FILE_STORAGE`, `STATICFILES_STORAGE`, or `R2_CUSTOM_DOMAIN` in code

---

## Pre-Deployment Tasks

### 1. Cloudflare R2 Setup

**Prerequisite:** Create R2 bucket and enable public access

```
Dashboard → R2 → Create bucket
  Name: pope-media (or your choice)
  
Settings → Public access
  Enable
  
R2 → Manage API tokens
  Create API token (NOT in Public Access settings)
  Copy: Access Key ID, Secret Access Key
  
Dashboard → Settings → Account
  Get: Account ID
  
R2 bucket → Public access
  Get: Public URL (e.g., pub-abc123def.r2.dev)
```

**If using custom domain:**
```
- Do NOT add DNS CNAME manually
- Add in bucket Settings → Custom Domains
- Domain must already be in Cloudflare DNS
- This is R2_PUBLIC_HOST value (without https://)
```

### 2. Neon PostgreSQL Setup

**Prerequisite:** Database must exist with migrations capability

```
neon.tech → Create project
  Database: tienda_pope (or your choice)
  Get: CONNECTION_STRING with sslmode=require
  Format: postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 3. Render Service Setup

**Create new service:**

| Field | Value |
|-------|-------|
| Name | pope-backend |
| Repository | Alejandro-lopez1/tienda-pope |
| Branch | master |
| Root Directory | `backend` |
| Runtime | Native |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| Start Command | `python manage.py migrate && gunicorn -c gunicorn_config.py config.wsgi` |

**Environment Variables** (replace placeholders with actual domains):

```
PYTHON_VERSION=3.12.x
DEBUG=False
SECRET_KEY=<generate: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DATABASE_URL=<Neon connection string with ?sslmode=require>
ALLOWED_HOSTS=<actual-render-domain>.onrender.com,<your-api-domain.com>
CORS_ALLOWED_ORIGINS=https://<actual-pages-domain>.pages.dev,https://<your-frontend-domain.com>
CSRF_TRUSTED_ORIGINS=https://<actual-pages-domain>.pages.dev,https://<your-frontend-domain.com>
USE_R2_STORAGE=True
R2_ACCOUNT_ID=<from Cloudflare>
R2_BUCKET_NAME=<your-bucket-name>
R2_ACCESS_KEY_ID=<from API token>
R2_SECRET_ACCESS_KEY=<from API token>
R2_PUBLIC_HOST=<pub-abc123.r2.dev or your custom domain>
```

**⚠️ CRITICAL:** If you use default names (`pope-backend.onrender.com`, etc.), check if they're taken. Render appends a suffix if needed. Update ALLOWED_HOSTS and CORS to match.

### 4. Cloudflare Pages Setup

**Create new Pages project:**

| Field | Value |
|-------|-------|
| Repository | Alejandro-lopez1/tienda-pope |
| Production branch | master |
| Framework | React |
| Build Command | `npm run build` |
| Build Output | `dist` |
| Root Directory | `frontend` |

**Environment Variables:**

```
VITE_API_URL=https://<actual-render-domain>/api/v1
```

**Custom Domain** (optional):
```
- If using custom domain, add in Pages Settings
- Domain must be in Cloudflare DNS (already connected)
- Example: pope.com.ar → Cloudflare Pages
```

**Note:** Pages assigns a default domain like `repo-name.pages.dev`. Update `VITE_API_URL` to point to the actual Render URL (not placeholder `pope-backend.onrender.com`).

---

## Deployment Order

### Prerequisites (before any deploy)

1. **Create Neon database**
   - Copy `DATABASE_URL` with `?sslmode=require`

2. **Create R2 bucket**
   - Enable public access (Settings → Public Access)
   - Create S3 API token (R2 → Manage API tokens, NOT Public Access)
   - Copy: Account ID, Access Key ID, Secret Access Key, Public URL

3. **Note actual domain names**
   - Render will assign: `<random>.onrender.com`
   - Cloudflare Pages will assign: `<repo-name>.pages.dev`
   - **Update ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS with real names**

### Deployment Steps

1. **Deploy Render backend first**
   - Build completes (checks Python 3.12, runs collectstatic)
   - Migrations run automatically
   - Gunicorn starts on assigned port (reads $PORT env var)
   - Verify: `curl https://<actual-render-url>/api/v1/categories/` → 200 OK (returns empty list)

2. **Create superuser and load initial data (from your PC)**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
   python backend/manage.py createsuperuser
   # Optional: load initial categories, products, etc.
   ```

3. **Deploy Cloudflare Pages frontend**
   - Build completes (npm run build outputs dist/)
   - _redirects deployed (frontend/public/_redirects)
   - Frontend accessible at assigned Pages domain

4. **Verify Integration**
   - Frontend can reach backend (CORS working: no browser errors)
   - Admin at `/admin/` has styles (dark/light theme visible)
   - Image upload works (goes to R2 if enabled)

---

## Post-Deployment Verification

### Criterion 7: Images load, no expiration

```bash
# 1. Open admin at https://<actual-render-url>/admin/
# 2. Log in with superuser created earlier
# 3. Upload image to a product (e.g., photo.jpg)
# 4. Open image URL in incognito: https://<R2_PUBLIC_HOST>/media/products/photo.jpg
# 5. Verify: Loads successfully
# 6. Wait 1+ hour
# 7. Reload in incognito: Still loads (no X-Amz-Signature param in URL)
```

**Expected:** Image loads both times, URL is stable with no query params (proves no signed URLs with expiration).

### Criterion 8: Admin has styles

```bash
# 1. Open https://<actual-render-url>/admin/
# 2. Check: Login form has CSS (styled inputs, dark/light theme)
# 3. Check: It's not plain HTML
```

**Expected:** Styled login form with CSS, not bare HTML form.

### Criterion 9: Frontend routes don't 404

```bash
# 1. Open https://<actual-pages-url>/carrito (cart page)
# 2. Hard refresh: Cmd/Ctrl + Shift + R
# 3. Check: Page renders (not 404)
# 4. Reason: _redirects redirects /carrito → /index.html → React Router takes over
```

**Expected:** Cart page loads, not "404 - Page not found".

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Render build fails: `KeyError: R2_PUBLIC_HOST` | Env var missing | Add to Render dashboard |
| Render build fails: `pip install` fails | Incompatible dependencies (e.g., Python 3.11 with Django 6) | Verify `PYTHON_VERSION=3.12.x` |
| Admin CSS missing | collectstatic didn't run | Verify Build Command includes `collectstatic` |
| Backend returns 400 Bad Request | ALLOWED_HOSTS mismatch | Verify env var matches actual Render domain |
| Frontend CORS error | CORS_ALLOWED_ORIGINS mismatch | Update env var to actual Pages domain |
| Images 403 Forbidden | R2 public access disabled | Enable in Cloudflare R2 Settings → Public Access |
| Images 404 | Wrong R2_PUBLIC_HOST | Verify hostname matches R2 public URL or custom domain |
| Frontend 404 on reload | _redirects not deployed | Verify `frontend/public/_redirects` exists and deployed |
| First request after idle is slow | Normal on Render free plan | Service "wakes up"; subsequent requests are fast |

---

## Known Limitations & Important Notes

- **No Shell access on Render free plan:** You must create the superuser from your PC with `DATABASE_URL` pointing to Neon. See "Deployment Steps" above.
- **WhatsApp number in git history:** Old number appears in old commits (not in `.env.example` anymore). If this is a concern, you can rewrite history, but it's already visible to anyone with repo access.
- **Docker local with DEBUG=False:** Admin requires `python manage.py collectstatic` step first. For local development, use `DEBUG=True` (filesystem storage easier).
- **R2 requires public access:** `R2_PUBLIC_HOST` only works if you've enabled public access in Cloudflare R2 Settings → Public Access, or connected a custom domain.
- **Render domain names:** Render assigns domains like `<name>.onrender.com`. If your name is taken, it appends a suffix. Check the actual domain after creation and update `ALLOWED_HOSTS`.
- **First request after idle:** On Render free plan, the first request after ~15 minutes of inactivity is slow (service "waking up"). This is normal, not a bug.

---

## Rollback Plan

If deployment fails after merge to master:

**Option 1 (Recommended - Render):**
```
Render Dashboard → Deployments → Select previous working deploy → Redeploy
```

**Option 2 (Git revert - not recommended):**
```bash
# Only works if there was an actual merge commit
# Fast-forward merges create linear history (no merge commit to revert)
git log --oneline | grep -i "merge"
# If no merge commit found, use Option 1 instead
```

**Note:** Reverting in git would leave you with old Django 4.2 + Python 3.11, which doesn't deploy. Use Render's redeploy feature instead.

---

## Notes

- Code is production-ready (verified with Python 3.12, Django 6.1.3)
- All acceptance criteria 1-6 tested locally
- Criteria 7-9 only verifiable post-deployment
- Render ignores Procfile; config is in dashboard
- Cloudflare Pages auto-deploys on push to master branch

---

**Checklist prepared:** 2026-11-06  
**Ready to deploy:** ✅ YES


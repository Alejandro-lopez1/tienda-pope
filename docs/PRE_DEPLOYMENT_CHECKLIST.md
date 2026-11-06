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
  Get: Account ID, API Token (Access Key ID, Secret Access Key)
  Get: Public URL (e.g., pub-abc123def.r2.dev)
```

**If using custom domain:**
```
- Point DNS CNAME to Cloudflare R2
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

**Environment Variables** (paste all):

```
PYTHON_VERSION=3.12.x
DEBUG=False
SECRET_KEY=<generate: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DATABASE_URL=<Neon connection string with ?sslmode=require>
ALLOWED_HOSTS=pope-backend.onrender.com,api.pope.com.ar
CORS_ALLOWED_ORIGINS=https://pope.pages.dev,https://pope.com.ar
CSRF_TRUSTED_ORIGINS=https://pope.pages.dev,https://pope.com.ar
USE_R2_STORAGE=True
R2_ACCOUNT_ID=<from Cloudflare>
R2_BUCKET_NAME=pope-media
R2_ACCESS_KEY_ID=<from API token>
R2_SECRET_ACCESS_KEY=<from API token>
R2_PUBLIC_HOST=<pub-abc123.r2.dev or custom domain>
```

**Note:** If R2_PUBLIC_HOST is missing and `USE_R2_STORAGE=True`, deployment fails at build step with clear error.

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
VITE_API_URL=https://pope-backend.onrender.com/api/v1
```

**Custom Domain** (optional):
```
- pope.com.ar → Cloudflare Pages
- api.pope.com.ar → Render (via DNS CNAME or IP)
- media.pope.com.ar → R2 (optional, if using custom domain for R2)
```

---

## Deployment Order

1. **Deploy Render** (backend)
   - Build completes (checks Python 3.12, runs collectstatic)
   - Migrations run
   - Gunicorn starts on assigned port
   - Health check: `curl https://<render-url>/api/v1/health` (if endpoint exists)

2. **Deploy Cloudflare Pages** (frontend)
   - Build completes (npm run build outputs dist/)
   - _redirects deployed (frontend/public/_redirects)
   - Frontend accessible at https://pope.pages.dev

3. **Verify Integration**
   - Frontend can reach backend (CORS working)
   - Admin at `/admin/` has styles (admin CSS served by WhiteNoise)
   - Image upload works (goes to R2 if enabled)

---

## Post-Deployment Verification

### Criterion 7: Images load, no expiration

```bash
# 1. SSH into Render or use Django admin at /admin/
# 2. Upload image to a product (e.g., photo.jpg)
# 3. Open image URL in incognito: https://pub-<hash>.r2.dev/media/products/photo.jpg
# 4. Verify: Loads successfully
# 5. Wait 1+ hour
# 6. Reload in incognito: Still loads (no X-Amz-Signature param in URL)
```

**Expected:** Image loads both times, URL is stable with no query params.

### Criterion 8: Admin has styles

```bash
# 1. Open https://pope-backend.onrender.com/admin/
# 2. Check: Login form has CSS (styled, not plain HTML)
# 3. Check: Reason is collectstatic ran and WhiteNoise compressed CSS
```

**Expected:** Styled login form with dark/light theme, input fields with borders.

### Criterion 9: Frontend routes don't 404

```bash
# 1. Open https://pope.pages.dev/carrito (cart page)
# 2. Hard refresh: Cmd/Ctrl + Shift + R
# 3. Check: Page renders (not 404)
# 4. Reason: _redirects redirects /carrito → /index.html → React Router
```

**Expected:** Cart page loads, not "404 - Page not found".

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Render build fails: `KeyError: R2_PUBLIC_HOST` | Env var missing | Add to Render dashboard |
| Render build fails: `pip install` times out | Network issue | Check Neon DB connectivity |
| Admin CSS missing | collectstatic didn't run | Verify Build Command includes `collectstatic` |
| Images 403 Forbidden | R2 public access disabled | Enable in Cloudflare R2 settings |
| Images 404 | Wrong R2_PUBLIC_HOST | Verify hostname matches R2 public URL |
| Frontend 404 on reload | _redirects not deployed | Verify `frontend/public/_redirects` exists |
| CORS error | Origins not in CSRF_TRUSTED_ORIGINS | Update Render env var |

---

## Known Limitations

- **WhatsApp number in git history:** Old number appears in old commits, not in `.env.example` (now uses placeholder). No impact on production.
- **Docker local with DEBUG=False:** Admin requires `collectstatic` step; `DEBUG=True` uses filesystem storage (easier for development).
- **R2 requires public access:** `R2_PUBLIC_HOST` only works if bucket has public access enabled in Cloudflare.

---

## Rollback Plan

If deployment fails after merge to master:

```bash
git revert -m 1 <merge-commit-hash>
git push origin master
# Render will auto-deploy from new master
```

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


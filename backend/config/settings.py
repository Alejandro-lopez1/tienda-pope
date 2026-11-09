import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ===== SECURITY SETTINGS =====
# CRITICAL: SECRET_KEY must be set in production environment
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if os.environ.get('DEBUG', 'False') == 'True':
        # Development only: generate temporary key
        from django.core.management.utils import get_random_secret_key
        SECRET_KEY = get_random_secret_key()
    else:
        # Production: fail if not set
        raise ValueError("SECRET_KEY environment variable must be set in production")

# DEBUG must be explicitly set to False in production
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS must be explicitly configured per environment
ALLOWED_HOSTS = [host.strip() for host in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.auth',
    'apps.categories',
    'apps.products',
    'apps.orders',
    'apps.customers',
    # 'apps.reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise for efficient static file serving in production
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ===== DATABASE CONFIGURATION =====
# Support both DATABASE_URL (production with Neon) and individual DB_* variables (development)
import dj_database_url

if os.environ.get('DATABASE_URL'):
    # Production: Use DATABASE_URL from Neon
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development: Use individual DB_* environment variables
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'tienda_pope'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', 'db'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# ===== STATIC FILES =====
STATIC_URL = '/staticfiles/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ===== MEDIA FILES & STORAGE =====
# Use R2 if explicitly enabled; otherwise use filesystem
USE_R2 = os.environ.get("USE_R2_STORAGE", "False") == "True"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if DEBUG
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        )
    },
}
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

if USE_R2:
    # R2_PUBLIC_HOST is REQUIRED when using R2
    if "R2_PUBLIC_HOST" not in os.environ:
        raise KeyError(
            "R2_PUBLIC_HOST environment variable is required when USE_R2_STORAGE=True. "
            "Set it to your R2 bucket's public hostname (without https://). "
            "Example: cdn.example.com or pub-<hash>.r2.dev"
        )
    
    R2_PUBLIC_HOST = os.environ["R2_PUBLIC_HOST"]
    INSTALLED_APPS = list(INSTALLED_APPS) + ["storages"]
    AWS_STORAGE_BUCKET_NAME = os.environ["R2_BUCKET_NAME"]
    AWS_S3_ENDPOINT_URL = f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    AWS_S3_REGION_NAME = "auto"
    AWS_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
    AWS_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "location": "media",
            "querystring_auth": False,
            "custom_domain": R2_PUBLIC_HOST,
        },
    }
    MEDIA_URL = f"https://{R2_PUBLIC_HOST}/media/"

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===== REST FRAMEWORK CONFIGURATION =====
NUM_PROXIES = int(os.environ.get('NUM_PROXIES', '1'))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # No global anon/user throttles; scopes applied on public order actions.
    'DEFAULT_THROTTLE_RATES': {
        'orders_create': '10/min',
        'orders_public': '30/min',
    },
    'NUM_PROXIES': NUM_PROXIES,
}

# ===== JWT CONFIGURATION =====
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# ===== CORS CONFIGURATION =====
CORS_ALLOWED_ORIGINS = [
    o.strip().rstrip('/')
    for o in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:5173',
    ).split(',')
    if o.strip()
]

# ===== CSRF CONFIGURATION =====
CSRF_TRUSTED_ORIGINS = [
    o.strip().rstrip('/')
    for o in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173',
    ).split(',')
    if o.strip()
]

# ===== SECURITY SETTINGS FOR PRODUCTION =====
# These settings are automatically disabled in DEBUG mode
if not DEBUG:
    # Force HTTPS redirect in production
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
    SECURE_REDIRECT_EXEMPT = [r'^health/$']

    # Secure cookies (only sent over HTTPS)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 31536000))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True') == 'True'
    SECURE_HSTS_PRELOAD = os.environ.get('SECURE_HSTS_PRELOAD', 'True') == 'True'

    # Additional security headers
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ===== LOGGING =====
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.environ.get('LOG_LEVEL', 'INFO').upper(),
    },
}

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

# WhiteNoise configuration for efficient static file handling
# In production with R2, this will be handled by the R2 storage backend
# For local/non-R2 deployments, use WhiteNoise
if not os.environ.get('USE_R2_STORAGE', 'False') == 'True':
    # Only use WhiteNoise for local/filesystem storage
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ===== MEDIA FILES & STORAGE =====
# Development: Local filesystem storage
# Production: Cloudflare R2 storage via boto3

if os.environ.get('USE_R2_STORAGE', 'False') == 'True':
    # Production: Use Cloudflare R2 for media storage
    # Add django-storages to INSTALLED_APPS if using R2
    if 'storages' not in INSTALLED_APPS:
        INSTALLED_APPS = list(INSTALLED_APPS) + ['storages']
    
    # Configure boto3 for Cloudflare R2
    AWS_STORAGE_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
    AWS_S3_REGION_NAME = 'auto'  # Cloudflare R2 uses 'auto'
    AWS_S3_ENDPOINT_URL = f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com"
    AWS_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
    
    # Django 6.0+ uses STORAGES dict instead of DEFAULT_FILE_STORAGE
    # Use custom domain if available, otherwise use public R2 URL
    r2_custom_domain = os.environ.get('R2_CUSTOM_DOMAIN')
    if r2_custom_domain:
        # If custom domain exists, use it directly (must already include protocol)
        AWS_S3_CUSTOM_DOMAIN = r2_custom_domain
        r2_media_url = f"{r2_custom_domain}/"
        r2_static_url = f"{r2_custom_domain}/staticfiles/"
    else:
        # Use public R2 URL: https://<bucket-name>.r2.dev or https://<account-id>.r2.cloudflarestorage.com
        # For public bucket, use r2.dev domain which is publicly accessible
        bucket_url = f"https://{AWS_STORAGE_BUCKET_NAME}.r2.dev"
        r2_media_url = f"{bucket_url}/"
        r2_static_url = f"{bucket_url}/staticfiles/"
    
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'location': 'media',
                'custom_domain': AWS_S3_CUSTOM_DOMAIN if r2_custom_domain else None,
            }
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
            'OPTIONS': {
                'location': 'staticfiles',
                'custom_domain': AWS_S3_CUSTOM_DOMAIN if r2_custom_domain else None,
            }
        }
    }
    
    # Media and static file URLs
    MEDIA_URL = r2_media_url
    STATIC_URL = r2_static_url
    
else:
    # Development: Local filesystem storage
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        }
    }
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
    STATIC_URL = '/staticfiles/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===== REST FRAMEWORK CONFIGURATION =====
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
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
    origin.strip() for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:5173'
    ).split(',')
]

# ===== CSRF CONFIGURATION =====
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173'
    ).split(',')
]

# ===== SECURITY SETTINGS FOR PRODUCTION =====
# These settings are automatically disabled in DEBUG mode
if not DEBUG:
    # Force HTTPS redirect in production
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
    
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
        'level': os.environ.get('LOG_LEVEL', 'INFO'),
    },
}

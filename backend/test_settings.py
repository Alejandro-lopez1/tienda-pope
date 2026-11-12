"""
Test-specific Django settings using SQLite instead of PostgreSQL.
Used by manage.py test with DJANGO_SETTINGS_MODULE=test_settings
"""
from config.settings import *

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # Use in-memory database for speed
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = DisableMigrations()

# Simplify settings for testing
DEBUG = True
SECRET_KEY = 'test-secret-key'
ALLOWED_HOSTS = ['*']

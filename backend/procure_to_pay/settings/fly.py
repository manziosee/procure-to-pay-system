"""
Fly.io production settings for procure-to-pay system
"""
import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    'procure-to-pay-backend.fly.dev',
    '.fly.dev',
    'localhost',
    '127.0.0.1',
    '172.19.26.170',
    '*',  # Allow all hosts for health checks
]

# Database - Use Neon PostgreSQL
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DATABASE_NAME', 'procure_to_pay'),
            'USER': os.environ.get('DATABASE_USER', 'postgres'),
            'PASSWORD': os.environ.get('DATABASE_PASSWORD', ''),
            'HOST': os.environ.get('DATABASE_HOST', 'localhost'),
            'PORT': os.environ.get('DATABASE_PORT', '5432'),
        }
    }

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings for Fly.io
CORS_ALLOWED_ORIGINS = [
    "https://procure-to-pay-system.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Security settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# OpenAI API Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
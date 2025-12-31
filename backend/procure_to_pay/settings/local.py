from .base import *

# Local development settings
DEBUG = True

# Use environment variables or fallback to base settings
DATABASE_URL = config('DATABASE_URL', default=None)
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
# If no DATABASE_URL, base.py will handle the database configuration

# Local development CORS
CORS_ALLOW_ALL_ORIGINS = True
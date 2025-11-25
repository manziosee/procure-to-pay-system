from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Procure-to-Pay Backend',
        'version': '1.0.0'
    })

def root_view(request):
    return JsonResponse({
        'message': 'Welcome to Procure-to-Pay API',
        'endpoints': {
            'api': '/api/',
            'swagger': '/api/docs/',
            'redoc': '/api/redoc/',
            'schema': '/api/schema/',
            'health': '/health/',
            'admin': '/admin/'
        }
    })

urlpatterns = [
    # Root and health endpoints
    path('', root_view, name='root'),
    path('health/', health_check, name='health'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('procure_to_pay.apps.authentication.urls')),
    path('api/', include('procure_to_pay.apps.requests.urls')),
    path('api/documents/', include('procure_to_pay.apps.documents.urls')),
    path('api/proforma/', include('procure_to_pay.apps.documents.urls_new')),
    path('api/', include('procure_to_pay.apps.api.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
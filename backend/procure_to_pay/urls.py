from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Procure-to-Pay API",
        default_version='v1',
        description="API for Purchase Request & Approval System",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('procure_to_pay.apps.authentication.urls')),
    path('api/', include('procure_to_pay.apps.requests.urls')),
    path('api/documents/', include('procure_to_pay.apps.documents.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Procure-to-Pay System API",
        default_version='v1',
        description="""Complete API for Purchase Request & Approval System
        
## Features
- JWT Authentication with role-based access
- Multi-level approval workflow
- AI-powered document processing
- Automatic PO generation
- Receipt validation

## Demo Users
- **Staff**: staff1 / password123
- **Approver L1**: approver1 / password123  
- **Approver L2**: approver2 / password123
- **Finance**: finance1 / password123

## Workflow
1. Staff creates request → Pending
2. Approver L1 approves → Still Pending
3. Approver L2 approves → Approved (PO generated)
4. Any rejection → Rejected (final)
        """,
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="admin@procure2pay.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('procure_to_pay.apps.authentication.urls')),
    path('api/', include('procure_to_pay.apps.requests.urls')),
    path('api/documents/', include('procure_to_pay.apps.documents.urls')),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
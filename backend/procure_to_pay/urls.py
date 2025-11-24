from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

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
            'redoc': '/redoc/',
            'health': '/health/',
            'admin': '/admin/'
        }
    })

schema_view = get_schema_view(
    openapi.Info(
        title="Procure-to-Pay System API",
        default_version='v1',
        description="""Complete API for Purchase Request & Approval System
        
## Features
- JWT Authentication with role-based access
- User registration and email-based login
- Multi-level approval workflow
- AI-powered document processing
- Proforma upload and data extraction
- Automatic PO generation
- Receipt validation with discrepancy detection

## Authentication Endpoints
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with email/password
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/refresh/` - Refresh JWT token

## Purchase Request Endpoints
- `GET /api/requests/` - List requests (role-filtered)
- `POST /api/requests/` - Create new request
- `GET /api/requests/{id}/` - Get request details
- `PUT /api/requests/{id}/` - Update request
- `PATCH /api/requests/{id}/approve/` - Approve request
- `PATCH /api/requests/{id}/reject/` - Reject request
- `POST /api/requests/{id}/submit-receipt/` - Submit receipt

## Document Processing Endpoints
- `POST /api/documents/process/` - Process any document
- `POST /api/proforma/upload/` - Upload proforma invoice
- `POST /api/proforma/{id}/generate-po/` - Generate PO from proforma
- `POST /api/proforma/po/{id}/validate-receipt/` - Validate receipt against PO

## Demo Users
- **Staff**: staff1@example.com / password123
- **Approver L1**: approver1@example.com / password123  
- **Approver L2**: approver2@example.com / password123
- **Finance**: finance1@example.com / password123

## Complete Workflow
1. **Registration**: User registers with email/password
2. **Login**: User logs in with email to get JWT tokens
3. **Proforma Upload**: Staff uploads proforma → AI extracts data
4. **Request Creation**: Staff creates purchase request
5. **Approval L1**: First approver reviews → Approves/Rejects
6. **Approval L2**: Second approver reviews → Final decision
7. **PO Generation**: Auto-generated on final approval
8. **Receipt Upload**: Staff uploads receipt → Validated against PO
9. **Discrepancy Detection**: System flags any mismatches

View complete API documentation at /redoc/
        """,
        contact=openapi.Contact(email="admin@procure2pay.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],
)

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
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    method='get',
    operation_description="API Root - Lists all available endpoints",
    responses={
        200: openapi.Response(
            description="Available API endpoints",
            examples={
                "application/json": {
                    "auth": "http://localhost:8000/api/auth/",
                    "requests": "http://localhost:8000/api/requests/",
                    "documents": "http://localhost:8000/api/documents/"
                }
            }
        )
    },
    tags=['API Root']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'message': 'Procure-to-Pay API Root',
        'endpoints': {
            'auth': reverse('token_obtain_pair', request=request, format=format),
            'profile': reverse('user_profile', request=request, format=format),
            'requests': reverse('requests-list', request=request, format=format),
            'documents': request.build_absolute_uri('/api/documents/'),
        },
        'documentation': {
            'swagger': request.build_absolute_uri('/swagger/'),
            'redoc': request.build_absolute_uri('/redoc/'),
        },
        'demo_users': {
            'staff': 'staff1 / password123',
            'approver_l1': 'approver1 / password123',
            'approver_l2': 'approver2 / password123',
            'finance': 'finance1 / password123'
        }
    })
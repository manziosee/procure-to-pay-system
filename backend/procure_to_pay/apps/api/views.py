from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse
from drf_spectacular.utils import extend_schema

@extend_schema(
    description="API Root - Lists all available endpoints",
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
            'swagger': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
        },
        'demo_users': {
            'staff': 'staff1 / password123',
            'approver_l1': 'approver1 / password123',
            'approver_l2': 'approver2 / password123',
            'finance': 'finance1 / password123'
        }
    })
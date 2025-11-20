from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .serializers import UserSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get current user profile information",
        responses={
            200: UserSerializer,
            401: "Authentication required"
        },
        tags=['Authentication']
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
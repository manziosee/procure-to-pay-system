from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .serializers import UserSerializer, UserRegistrationSerializer

class UserRegistrationView(APIView):
    permission_classes = []  # No authentication required for registration
    
    @swagger_auto_schema(
        operation_description="Register a new user account",
        request_body=UserRegistrationSerializer,
        responses={
            201: openapi.Response(
                description="User registered successfully",
                examples={
                    "application/json": {
                        "id": 1,
                        "username": "newuser",
                        "email": "user@example.com",
                        "first_name": "John",
                        "last_name": "Doe",
                        "role": "staff",
                        "department": "IT"
                    }
                }
            ),
            400: "Validation error"
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department': user.department
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
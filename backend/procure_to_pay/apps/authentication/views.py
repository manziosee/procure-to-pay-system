from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=RegisterSerializer,
        responses={
            201: openapi.Response('User created', UserSerializer),
            400: "Validation error"
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        operation_description="Login user and get JWT tokens",
        request_body=LoginSerializer,
        responses={
            200: openapi.Response('Login successful', openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'access': openapi.Schema(type=openapi.TYPE_STRING),
                    'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                    'user': UserSerializer
                }
            )),
            400: "Invalid credentials"
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
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
import logging

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from drf_spectacular.utils import extend_schema
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

logger = logging.getLogger(__name__)


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE_NAME,
        str(refresh_token),
        httponly=True,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.REFRESH_TOKEN_COOKIE_NAME,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="register_user",
        description="Register a new user",
        request=RegisterSerializer,
        responses={201: UserSerializer, 400: None},
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

    @extend_schema(
        operation_id="login_user",
        description=(
            "Login user and get a JWT access token. The refresh token is set as an "
            "httpOnly cookie rather than returned in the response body."
        ),
        request=LoginSerializer,
        responses={200: None, 400: None},
        tags=['Authentication']
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)

            response = Response({
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
            _set_refresh_cookie(response, refresh)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CookieTokenRefreshView(TokenRefreshView):
    """Reads the refresh token from the httpOnly cookie instead of the request body,
    and (since ROTATE_REFRESH_TOKENS is on) re-sets the rotated refresh token as a
    cookie rather than exposing it in the JSON response."""

    @extend_schema(
        description="Refresh JWT access token using the httpOnly refresh token cookie",
        request=None,
        responses={200: None, 401: None},
        tags=['Authentication']
    )
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if not refresh_token:
            return Response({'error': 'Refresh token cookie not found'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            response = Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
            _clear_refresh_cookie(response)
            return response

        data = serializer.validated_data
        response = Response({'access': data['access']})

        rotated_refresh = data.get('refresh')
        if rotated_refresh:
            _set_refresh_cookie(response, rotated_refresh)

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="logout_user",
        description="Logout user by blacklisting the refresh token stored in the httpOnly cookie",
        request=None,
        responses={200: None, 400: None, 401: None},
        tags=['Authentication']
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        response_status = status.HTTP_200_OK
        payload = {'message': 'Logout successful'}

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                payload = {'error': 'Invalid or expired refresh token'}
                response_status = status.HTTP_400_BAD_REQUEST
            except Exception:
                logger.exception('Unexpected error blacklisting refresh token during logout')
                payload = {'error': 'Logout failed'}
                response_status = status.HTTP_400_BAD_REQUEST

        response = Response(payload, status=response_status)
        _clear_refresh_cookie(response)
        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_user_profile",
        description="Get current user profile information",
        responses={200: UserSerializer, 401: None},
        tags=['Authentication']
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

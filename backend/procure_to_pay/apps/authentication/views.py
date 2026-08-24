import base64
import logging
from io import BytesIO

import pyotp
import qrcode
from django.conf import settings
from django.core import signing
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
from .models import User

logger = logging.getLogger(__name__)

TWO_FA_CHALLENGE_SALT = 'two-factor-login-challenge'
TWO_FA_CHALLENGE_MAX_AGE = 300  # 5 minutes


def _issue_tokens_response(user):
    refresh = RefreshToken.for_user(user)
    response = Response({
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data
    })
    _set_refresh_cookie(response, refresh)
    return response


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

            if user.totp_enabled:
                challenge = signing.dumps(user.id, salt=TWO_FA_CHALLENGE_SALT)
                return Response({'requires_2fa': True, 'challenge': challenge})

            return _issue_tokens_response(user)
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


class TwoFactorSetupView(APIView):
    """Generates a new TOTP secret and a QR code for the user to scan in an
    authenticator app. The secret isn't active until confirmed via TwoFactorEnableView."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="setup_2fa",
        description="Generate a new TOTP secret and QR code for setting up 2FA",
        request=None,
        responses={200: None},
        tags=['Authentication']
    )
    def post(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.totp_enabled = False
        user.save(update_fields=['totp_secret', 'totp_enabled'])

        otpauth_url = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name='Procure-to-Pay')

        qr = qrcode.make(otpauth_url)
        buffer = BytesIO()
        qr.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({
            'secret': secret,
            'otpauth_url': otpauth_url,
            'qr_code_base64': f'data:image/png;base64,{qr_code_base64}',
        })


class TwoFactorEnableView(APIView):
    """Confirms 2FA setup by verifying a code against the pending secret."""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="enable_2fa",
        description="Confirm 2FA setup with a code from the authenticator app",
        request=None,
        responses={200: None, 400: None},
        tags=['Authentication']
    )
    def post(self, request):
        user = request.user
        code = str(request.data.get('code', '')).strip()

        if not user.totp_secret:
            return Response({'error': 'Call setup first to generate a secret'}, status=status.HTTP_400_BAD_REQUEST)

        if not pyotp.TOTP(user.totp_secret).verify(code, valid_window=1):
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = True
        user.save(update_fields=['totp_enabled'])
        return Response({'message': '2FA enabled successfully'})


class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="disable_2fa",
        description="Disable 2FA (requires current password)",
        request=None,
        responses={200: None, 400: None},
        tags=['Authentication']
    )
    def post(self, request):
        user = request.user
        password = request.data.get('password', '')

        if not user.check_password(password):
            return Response({'error': 'Incorrect password'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = False
        user.totp_secret = ''
        user.save(update_fields=['totp_enabled', 'totp_secret'])
        return Response({'message': '2FA disabled successfully'})


class TwoFactorVerifyView(APIView):
    """Second step of login when the account has 2FA enabled: exchanges the
    short-lived challenge from LoginView plus a TOTP code for real JWT tokens."""
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="verify_2fa",
        description="Complete login by verifying a 2FA code against the login challenge",
        request=None,
        responses={200: None, 400: None},
        tags=['Authentication']
    )
    def post(self, request):
        challenge = request.data.get('challenge', '')
        code = str(request.data.get('code', '')).strip()

        try:
            user_id = signing.loads(challenge, salt=TWO_FA_CHALLENGE_SALT, max_age=TWO_FA_CHALLENGE_MAX_AGE)
        except signing.BadSignature:
            return Response({'error': 'Invalid or expired login challenge'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired login challenge'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.totp_enabled:
            return Response({'error': '2FA is not enabled for this account'}, status=status.HTTP_400_BAD_REQUEST)

        if not pyotp.TOTP(user.totp_secret).verify(code, valid_window=1):
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        return _issue_tokens_response(user)

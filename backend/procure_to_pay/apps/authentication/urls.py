from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, UserProfileView, CookieTokenRefreshView,
    TwoFactorSetupView, TwoFactorEnableView, TwoFactorDisableView, TwoFactorVerifyView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa_enable'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa_verify'),
]

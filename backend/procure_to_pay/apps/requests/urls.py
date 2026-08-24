from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseRequestViewSet, VendorViewSet

router = DefaultRouter()
router.register(r'requests', PurchaseRequestViewSet, basename='requests')
router.register(r'vendors', VendorViewSet, basename='vendors')

urlpatterns = [
    path('', include(router.urls)),
]
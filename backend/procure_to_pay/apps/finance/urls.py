from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialDocumentViewSet, ComplianceAlertViewSet

router = DefaultRouter()
router.register(r'documents', FinancialDocumentViewSet, basename='financial-documents')
router.register(r'alerts', ComplianceAlertViewSet, basename='compliance-alerts')

urlpatterns = [
    path('', include(router.urls)),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialDocumentViewSet, ComplianceAlertViewSet, BudgetViewSet

router = DefaultRouter()
router.register(r'documents', FinancialDocumentViewSet, basename='financial-documents')
router.register(r'alerts', ComplianceAlertViewSet, basename='compliance-alerts')
router.register(r'budgets', BudgetViewSet, basename='budgets')

urlpatterns = [
    path('', include(router.urls)),
]
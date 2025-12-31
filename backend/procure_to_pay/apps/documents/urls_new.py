from django.urls import path
from .views_new import ProformaUploadView, GeneratePOView, ReceiptValidationView

urlpatterns = [
    path('proforma/upload/', ProformaUploadView.as_view(), name='proforma-upload'),
    path('proforma/<int:proforma_id>/generate-po/', GeneratePOView.as_view(), name='generate-po'),
    path('po/<int:po_id>/validate-receipt/', ReceiptValidationView.as_view(), name='validate-receipt'),
]
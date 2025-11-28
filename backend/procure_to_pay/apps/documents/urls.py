from django.urls import path
from .views import ProcessDocumentView

from django.http import JsonResponse

def document_health(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Document Processing',
        'supported_formats': ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'txt', 'csv']
    })

urlpatterns = [
    path('health/', document_health, name='document_health'),
    path('process/', ProcessDocumentView.as_view(), name='process_document'),
]
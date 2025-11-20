from django.contrib import admin
from .models import DocumentProcessing

@admin.register(DocumentProcessing)
class DocumentProcessingAdmin(admin.ModelAdmin):
    list_display = ('document_type', 'file', 'processed_at')
    list_filter = ('document_type', 'processed_at')
    readonly_fields = ('processed_at',)
from django.contrib import admin
from .models import DocumentProcessing, Proforma, PurchaseOrder, Receipt

@admin.register(DocumentProcessing)
class DocumentProcessingAdmin(admin.ModelAdmin):
    list_display = ('document_type', 'file', 'processed_at')
    list_filter = ('document_type', 'processed_at')
    readonly_fields = ('processed_at',)

@admin.register(Proforma)
class ProformaAdmin(admin.ModelAdmin):
    list_display = ('vendor_name', 'uploaded_by', 'created_at')
    list_filter = ('created_at',)

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'total', 'created_at')
    list_filter = ('created_at',)

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('po', 'uploaded_by', 'created_at')
    list_filter = ('created_at',)
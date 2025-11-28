from django.db import models
from django.conf import settings

class DocumentProcessing(models.Model):
    DOCUMENT_TYPES = [
        ('proforma', 'Proforma'),
        ('purchase_order', 'Purchase Order'),
        ('receipt', 'Receipt'),
    ]
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/')
    extracted_data = models.JSONField(default=dict)
    processed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.processed_at}"

class Proforma(models.Model):
    file = models.FileField(upload_to="proformas/")
    vendor_name = models.CharField(max_length=255, blank=True)
    extracted_data = models.JSONField(default=dict)
    document_processing = models.OneToOneField(DocumentProcessing, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Proforma - {self.vendor_name} - {self.created_at}"

class PurchaseOrder(models.Model):
    vendor = models.CharField(max_length=255)
    items = models.JSONField(default=list)
    terms = models.CharField(max_length=255, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    proforma = models.ForeignKey(Proforma, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"PO - {self.vendor} - ${self.total}"

class Receipt(models.Model):
    file = models.FileField(upload_to="receipts/")
    extracted_data = models.JSONField(default=dict)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE)
    discrepancies = models.JSONField(default=list)
    document_processing = models.OneToOneField(DocumentProcessing, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Receipt - PO {self.po.id} - {self.created_at}"
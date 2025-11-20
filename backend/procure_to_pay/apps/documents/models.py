from django.db import models

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
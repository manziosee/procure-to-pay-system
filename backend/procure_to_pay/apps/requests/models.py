from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from .validators import (
    FileTypeValidator, SecureFilenameValidator, 
    validate_amount, validate_title, validate_description
)

class PurchaseRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200, validators=[validate_title])
    description = models.TextField(validators=[validate_description])
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, 
        validators=[MinValueValidator(0), validate_amount]
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_requests')
    approved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Approval', related_name='approved_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    proforma = models.FileField(
        upload_to='proformas/', null=True, blank=True,
        validators=[FileTypeValidator('document'), SecureFilenameValidator()]
    )
    purchase_order = models.FileField(
        upload_to='purchase_orders/', null=True, blank=True,
        validators=[FileTypeValidator('pdf'), SecureFilenameValidator()]
    )
    receipt = models.FileField(
        upload_to='receipts/', null=True, blank=True,
        validators=[FileTypeValidator('document'), SecureFilenameValidator()]
    )
    
    # AI extracted data
    proforma_data = models.JSONField(default=dict, blank=True)
    receipt_data = models.JSONField(default=dict, blank=True)
    validation_results = models.JSONField(default=dict, blank=True)
    
    # Store file content in database for reliable access
    proforma_content = models.BinaryField(null=True, blank=True)
    proforma_filename = models.CharField(max_length=255, blank=True)
    proforma_content_type = models.CharField(max_length=100, blank=True)
    
    purchase_order_content = models.BinaryField(null=True, blank=True)
    purchase_order_filename = models.CharField(max_length=255, blank=True)
    
    receipt_content = models.BinaryField(null=True, blank=True)
    receipt_filename = models.CharField(max_length=255, blank=True)
    receipt_content_type = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['amount']),
            models.Index(fields=['created_at']),
        ]
    
    def clean(self):
        if self.status in ['approved', 'rejected'] and self.pk:
            original = PurchaseRequest.objects.get(pk=self.pk)
            if original.status in ['approved', 'rejected'] and original.status != self.status:
                raise ValidationError("Cannot change status of approved/rejected requests")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

class RequestItem(models.Model):
    request = models.ForeignKey(PurchaseRequest, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.request.title}"

class Approval(models.Model):
    request = models.ForeignKey(PurchaseRequest, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approved = models.BooleanField()
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['request', 'approver']
    
    def __str__(self):
        status = "Approved" if self.approved else "Rejected"
        return f"{self.request.title} - {status} by {self.approver.username}"
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class FinancialDocument(models.Model):
    DOCUMENT_TYPES = [
        ('invoice', 'Invoice'),
        ('receipt', 'Receipt'),
        ('report', 'Financial Report'),
        ('contract', 'Contract'),
        ('other', 'Other')
    ]
    
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file_content = models.BinaryField()
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']

class Budget(models.Model):
    """A monthly spend limit for a department. `department` is matched by string
    equality against User.department, which is itself free text (no FK)."""
    department = models.CharField(max_length=100, unique=True)
    monthly_limit = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['department']

    def __str__(self):
        return f"{self.department} (RWF {self.monthly_limit:,}/mo)"

class ComplianceAlert(models.Model):
    ALERT_TYPES = [
        ('high_value', 'High Value Request'),
        ('overdue_review', 'Overdue Review'),
        ('budget_exceeded', 'Budget Exceeded'),
        ('duplicate_request', 'Duplicate Request'),
        ('missing_document', 'Missing Document')
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical')
    ]
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS, default='medium')
    title = models.CharField(max_length=200)
    description = models.TextField()
    request = models.ForeignKey('requests.PurchaseRequest', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
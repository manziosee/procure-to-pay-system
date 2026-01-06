from rest_framework import serializers
from .models import FinancialDocument, ComplianceAlert

class FinancialDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialDocument
        fields = ['id', 'title', 'document_type', 'filename', 'content_type', 
                 'file_size', 'file_size_mb', 'uploaded_by', 'uploaded_by_name', 
                 'uploaded_at', 'description']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at', 'file_size', 'content_type']
    
    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)

class ComplianceAlertSerializer(serializers.ModelSerializer):
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    request_title = serializers.CharField(source='request.title', read_only=True)
    days_active = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplianceAlert
        fields = ['id', 'alert_type', 'severity', 'title', 'description', 
                 'request', 'request_title', 'created_at', 'resolved_at', 
                 'resolved_by', 'resolved_by_name', 'is_active', 'days_active']
        read_only_fields = ['id', 'created_at']
    
    def get_days_active(self, obj):
        from django.utils import timezone
        if obj.resolved_at:
            return (obj.resolved_at - obj.created_at).days
        return (timezone.now() - obj.created_at).days